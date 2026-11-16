import { 
  ScheduledMessage, 
  MessageStatus, 
  AppSettings, 
  DEFAULT_SETTINGS,
  QuickSnippet,
  FollowUpReminder
} from './types';

const STORAGE_KEY_MESSAGES = 'chronowa_scheduled_messages';
const STORAGE_KEY_SETTINGS = 'chronowa_app_settings';
const STORAGE_KEY_SNIPPETS = 'chronowa_quick_snippets';
const STORAGE_KEY_REMINDERS = 'chronowa_followup_reminders';

// Default starter snippets for immediate user value
const DEFAULT_SNIPPETS: QuickSnippet[] = [
  {
    id: 'snip_upi',
    shortcut: '/upi',
    title: 'UPI Payment Info',
    content: 'You can transfer via UPI to: pay.chronowa@okaxis (Please share a screenshot once done! 👍)',
  },
  {
    id: 'snip_address',
    shortcut: '/address',
    title: 'Office Address',
    content: 'Our location: Suite 402, Apex Towers, Innovation Hub, Tech City, 560100.',
  },
  {
    id: 'snip_pricing',
    shortcut: '/pricing',
    title: 'Service Packages',
    content: 'Thanks for reaching out! Packages: 1) Starter ($49), 2) Pro Growth ($120), 3) Custom Enterprise. Which fits best?',
  },
  {
    id: 'snip_hello',
    shortcut: '/hello',
    title: 'Friendly Welcome',
    content: 'Hi {name}! 👋 Hope you are having a productive day. How can I assist you today?',
  },
];

/**
 * Fetch all stored scheduled messages
 */
export async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_MESSAGES);
    return (result[STORAGE_KEY_MESSAGES] as ScheduledMessage[]) || [];
  } catch (err) {
    console.error('[ChronoWA] Failed to load messages:', err);
    return [];
  }
}

/**
 * Save or update a scheduled message and setup chrome.alarms
 */
export async function saveScheduledMessage(msg: ScheduledMessage): Promise<void> {
  const current = await getScheduledMessages();
  const updated = [msg, ...current.filter((m) => m.id !== msg.id)];
  await chrome.storage.local.set({ [STORAGE_KEY_MESSAGES]: updated });

  if (msg.status === 'pending') {
    const delayInMinutes = Math.max(0.05, (msg.scheduledTime - Date.now()) / (1000 * 60));
    await chrome.alarms.create(msg.id, { delayInMinutes });
    console.log(`[ChronoWA] Alarm registered for ${msg.id} in ${delayInMinutes.toFixed(2)} min.`);
  }
}

/**
 * Batch Schedule Helper with Anti-Ban Staggered Intervals
 */
export async function scheduleBatchMessages(
  recipients: string[],
  messageText: string,
  baseTimeEpoch: number,
  useHumanDelay: boolean = true,
  attachments?: any[]
): Promise<number> {
  const settings = await getAppSettings();
  const batchId = 'batch_' + Date.now();
  const staggerIntervalMs = (settings.batchDelaySeconds || 10) * 1000;

  let currentTargetTime = Math.max(Date.now() + 10000, baseTimeEpoch);

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i].trim();
    if (!recipient) continue;

    // Stagger each message by e.g. 10s + random 1-4s jitter
    const jitter = Math.floor(Math.random() * 4000);
    const scheduledEpoch = currentTargetTime + (i * staggerIntervalMs) + jitter;

    const newMsg: ScheduledMessage = {
      id: `msg_batch_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      recipient,
      message: messageText,
      scheduledTime: scheduledEpoch,
      status: 'pending',
      createdAt: Date.now(),
      useHumanDelay,
      attachments,
      batchGroupId: batchId,
    };

    await saveScheduledMessage(newMsg);
  }

  return recipients.length;
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
  error?: string
): Promise<void> {
  const current = await getScheduledMessages();
  const updated = current.map((m) => {
    if (m.id === id) {
      return {
        ...m,
        status,
        sentAt: status === 'sent' ? Date.now() : m.sentAt,
        error: error !== undefined ? error : m.error,
      };
    }
    return m;
  });

  await chrome.storage.local.set({ [STORAGE_KEY_MESSAGES]: updated });

  if (status !== 'pending') {
    await chrome.alarms.clear(id);
  }
}

/**
 * Delete a message from storage and clear its alarm
 */
export async function deleteScheduledMessage(id: string): Promise<void> {
  const current = await getScheduledMessages();
  const updated = current.filter((m) => m.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY_MESSAGES]: updated });
  await chrome.alarms.clear(id);
}

/**
 * Clear all completed / non-pending messages
 */
export async function clearCompletedMessages(): Promise<void> {
  const current = await getScheduledMessages();
  const updated = current.filter((m) => m.status === 'pending');
  await chrome.storage.local.set({ [STORAGE_KEY_MESSAGES]: updated });
}

/**
 * Reschedule an existing message
 */
export async function rescheduleMessage(id: string, newEpochTime: number): Promise<void> {
  const current = await getScheduledMessages();
  const msg = current.find((m) => m.id === id);
  if (!msg) return;

  const updatedMsg: ScheduledMessage = {
    ...msg,
    scheduledTime: newEpochTime,
    status: 'pending',
    error: undefined,
  };

  await saveScheduledMessage(updatedMsg);
}

/**
 * Quick Snippets Management
 */
export async function getQuickSnippets(): Promise<QuickSnippet[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_SNIPPETS);
    const list = result[STORAGE_KEY_SNIPPETS] as QuickSnippet[];
    if (!list || list.length === 0) {
      await chrome.storage.local.set({ [STORAGE_KEY_SNIPPETS]: DEFAULT_SNIPPETS });
      return DEFAULT_SNIPPETS;
    }
    return list;
  } catch (err) {
    console.error('[ChronoWA] Failed to get snippets:', err);
    return DEFAULT_SNIPPETS;
  }
}

export async function saveQuickSnippet(snippet: QuickSnippet): Promise<void> {
  const current = await getQuickSnippets();
  const updated = [snippet, ...current.filter((s) => s.id !== snippet.id)];
  await chrome.storage.local.set({ [STORAGE_KEY_SNIPPETS]: updated });
}

export async function deleteQuickSnippet(id: string): Promise<void> {
  const current = await getQuickSnippets();
  const updated = current.filter((s) => s.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY_SNIPPETS]: updated });
}

/**
 * Follow-Up Reminders Management
 */
export async function getFollowUpReminders(): Promise<FollowUpReminder[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_REMINDERS);
    return (result[STORAGE_KEY_REMINDERS] as FollowUpReminder[]) || [];
  } catch {
    return [];
  }
}

export async function saveFollowUpReminder(reminder: FollowUpReminder): Promise<void> {
  const current = await getFollowUpReminders();
  const updated = [reminder, ...current.filter((r) => r.id !== reminder.id)];
  await chrome.storage.local.set({ [STORAGE_KEY_REMINDERS]: updated });

  // Register chrome alarm with reminder_ prefix
  if (reminder.status === 'pending') {
    const delayInMinutes = Math.max(0.05, (reminder.remindAt - Date.now()) / (1000 * 60));
    await chrome.alarms.create(`reminder_${reminder.id}`, { delayInMinutes });
    console.log(`[ChronoWA] Follow-up reminder alarm set for ${reminder.chatTitle} in ${delayInMinutes.toFixed(2)} min.`);
  }
}

export async function updateReminderStatus(
  id: string,
  status: 'pending' | 'completed' | 'dismissed'
): Promise<void> {
  const current = await getFollowUpReminders();
  const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
  await chrome.storage.local.set({ [STORAGE_KEY_REMINDERS]: updated });
  await chrome.alarms.clear(`reminder_${id}`);
}

export async function deleteFollowUpReminder(id: string): Promise<void> {
  const current = await getFollowUpReminders();
  const updated = current.filter((r) => r.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY_REMINDERS]: updated });
  await chrome.alarms.clear(`reminder_${id}`);
}

/**
 * Settings Management
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY_SETTINGS] || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: updated });
  return updated;
}

/**
 * Sync Alarms on Browser Wake
 */
export async function syncPendingAlarms(): Promise<void> {
  const messages = await getScheduledMessages();
  const pending = messages.filter((m) => m.status === 'pending');
  for (const msg of pending) {
    const delayInMinutes = Math.max(0.05, (msg.scheduledTime - Date.now()) / (1000 * 60));
    await chrome.alarms.create(msg.id, { delayInMinutes });
  }

  const reminders = await getFollowUpReminders();
  const pendingReminders = reminders.filter((r) => r.status === 'pending');
  for (const r of pendingReminders) {
    const delayInMinutes = Math.max(0.05, (r.remindAt - Date.now()) / (1000 * 60));
    await chrome.alarms.create(`reminder_${r.id}`, { delayInMinutes });
  }

  console.log(`[ChronoWA] Synced ${pending.length} message alarms & ${pendingReminders.length} reminder alarms.`);
}
