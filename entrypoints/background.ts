import { defineBackground } from 'wxt/sandbox';
import { 
  getScheduledMessages, 
  updateMessageStatus, 
  saveScheduledMessage, 
  getAppSettings, 
  syncPendingAlarms,
  getFollowUpReminders,
  updateReminderStatus
} from '../utils/storage';
import { ScheduledMessage } from '../utils/types';

export default defineBackground(() => {
  console.log('[ChronoWA Pro] Background Service Worker activated.');

  // Sync alarms when extension starts or browser restarts
  chrome.runtime.onStartup.addListener(async () => {
    console.log('[ChronoWA Pro] Browser startup detected. Syncing pending alarms...');
    await syncPendingAlarms();
  });

  chrome.runtime.onInstalled.addListener(async () => {
    console.log('[ChronoWA Pro] Extension installed/updated. Syncing pending alarms...');
    await syncPendingAlarms();
  });

  // Handle triggered alarms
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log(`[ChronoWA Pro] Alarm trigger received for: ${alarm.name}`);

    // Case 1: Follow-Up Reminder Trigger
    if (alarm.name.startsWith('reminder_')) {
      const reminderId = alarm.name.replace('reminder_', '');
      await handleReminderAlarm(reminderId);
      return;
    }

    // Case 2: Scheduled Message Trigger
    const messages = await getScheduledMessages();
    const msg = messages.find((m) => m.id === alarm.name);

    if (!msg || msg.status !== 'pending') {
      console.log(`[ChronoWA Pro] Alarm ${alarm.name} skipped: Message is not pending.`);
      return;
    }

    try {
      await executeMessageDispatch(msg);
    } catch (err: any) {
      console.error(`[ChronoWA Pro] Error dispatching message ${msg.id}:`, err);
      await updateMessageStatus(msg.id, 'failed', err?.message || 'Dispatch failed');

      const settings = await getAppSettings();
      if (settings.desktopNotifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('/icon/128.png'),
          title: 'ChronoWA: Dispatch Alert ⚠️',
          message: `Failed to deliver scheduled message to ${msg.recipient}: ${err?.message || 'Check WhatsApp tab'}`,
        });
      }
    }
  });

  /**
   * Handle Follow-Up Reminders
   */
  async function handleReminderAlarm(reminderId: string) {
    const reminders = await getFollowUpReminders();
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder || reminder.status !== 'pending') return;

    await updateReminderStatus(reminderId, 'completed');

    const settings = await getAppSettings();
    if (settings.desktopNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/icon/128.png'),
        title: `⏰ Follow-Up Reminder: ${reminder.chatTitle}`,
        message: reminder.note || 'You scheduled a follow-up reminder for this conversation.',
        requireInteraction: true,
      });
    }
  }

  /**
   * Main Dispatch Execution Engine
   */
  async function executeMessageDispatch(msg: ScheduledMessage) {
    const settings = await getAppSettings();
    console.log(`[ChronoWA Pro] Starting dispatch for ${msg.recipient}...`);

    // Clean phone digits
    const cleanedDigits = msg.recipient.replace(/[^0-9]/g, '');
    const isPhoneNumber = cleanedDigits.length >= 10;

    const waTabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
    let targetTab: chrome.tabs.Tab;

    if (waTabs.length > 0) {
      targetTab = waTabs[0];
    } else {
      if (!settings.autoWakeTab) {
        throw new Error('WhatsApp Web tab is not open and Auto-Wake is disabled in Settings.');
      }
      console.log('[ChronoWA Pro] Auto-waking WhatsApp Web background tab...');
      targetTab = await chrome.tabs.create({
        url: 'https://web.whatsapp.com',
        active: false,
      });
      // Allow initial page load
      await new Promise((r) => setTimeout(r, 12000));
    }

    if (!targetTab.id) {
      throw new Error('Target WhatsApp Web tab ID not found.');
    }

    // Dynamic placeholder replacement (e.g. {name}, {time}, {date})
    let formattedText = msg.message;
    formattedText = formattedText.replace(/{name}/gi, msg.recipient);
    formattedText = formattedText.replace(/{time}/gi, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    formattedText = formattedText.replace(/{date}/gi, new Date().toLocaleDateString());

    if (isPhoneNumber) {
      // Use direct send link
      const directUrl = `https://web.whatsapp.com/send?phone=${cleanedDigits}&text=${encodeURIComponent(formattedText)}`;
      console.log(`[ChronoWA Pro] Loading direct chat URL for: ${cleanedDigits}`);
      await chrome.tabs.update(targetTab.id, { url: directUrl });

      // Wait for chat to load and text to populate
      await new Promise((r) => setTimeout(r, 7000));

      await chrome.tabs.sendMessage(targetTab.id, {
        action: 'TRIGGER_SEND_BUTTON',
        useHumanDelay: msg.useHumanDelay,
        minJitter: settings.antiBanJitterMinMs,
        maxJitter: settings.antiBanJitterMaxMs,
      });
    } else {
      // Contact name search
      console.log(`[ChronoWA Pro] Dispatching by contact search for: ${msg.recipient}`);
      await chrome.tabs.sendMessage(targetTab.id, {
        action: 'DISPATCH_BY_CONTACT_NAME',
        contactName: msg.recipient,
        message: formattedText,
        useHumanDelay: msg.useHumanDelay,
      });
    }

    // Mark as sent
    await updateMessageStatus(msg.id, 'sent');
    console.log(`[ChronoWA Pro] Message ${msg.id} successfully marked as SENT.`);

    // Desktop Notification
    if (settings.desktopNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/icon/128.png'),
        title: 'ChronoWA: Message Delivered! 🚀',
        message: `Successfully delivered scheduled message to ${msg.recipient}.`,
      });
    }

    // Recurring Schedule Handling
    if (msg.isRecurring && msg.recurringInterval) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const nextTime =
        msg.recurringInterval === 'daily'
          ? msg.scheduledTime + oneDayMs
          : msg.scheduledTime + 7 * oneDayMs;

      const nextMsg: ScheduledMessage = {
        ...msg,
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        scheduledTime: nextTime,
        status: 'pending',
        createdAt: Date.now(),
        sentAt: undefined,
        error: undefined,
      };

      await saveScheduledMessage(nextMsg);
      console.log(`[ChronoWA Pro] Scheduled next recurring instance for ${new Date(nextTime).toLocaleString()}`);
    }
  }
});
