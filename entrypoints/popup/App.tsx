import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Send, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Sliders,
  History,
  PhoneCall,
  FileText,
  Bell,
  Paperclip,
  Wand2,
  Users,
  Plus,
  ExternalLink
} from 'lucide-react';
import { 
  ScheduledMessage, 
  ActiveTab, 
  AppSettings, 
  DEFAULT_SETTINGS,
  QuickSnippet,
  FollowUpReminder,
  AITone,
  MediaAttachment
} from '../../utils/types';
import { 
  getScheduledMessages, 
  saveScheduledMessage, 
  deleteScheduledMessage, 
  clearCompletedMessages,
  rescheduleMessage,
  getAppSettings,
  saveAppSettings,
  getQuickSnippets,
  saveQuickSnippet,
  deleteQuickSnippet,
  getFollowUpReminders,
  saveFollowUpReminder,
  updateReminderStatus,
  deleteFollowUpReminder,
  scheduleBatchMessages
} from '../../utils/storage';
import { polishMessage } from '../../utils/aiPolish';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [snippets, setSnippets] = useState<QuickSnippet[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [nowEpoch, setNowEpoch] = useState<number>(Date.now());
  
  // Schedule Form State
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<string>('');
  const [batchRecipients, setBatchRecipients] = useState<string>('');
  const [message, setMessage] = useState<string>('Happy Birthday bhai! 🎂🎉 Wishing you massive health, success and happiness!');
  const [scheduleDate, setScheduleDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState<string>('00:00');
  const [useHumanDelay, setUseHumanDelay] = useState<boolean>(true);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly'>('daily');
  const [attachment, setAttachment] = useState<MediaAttachment | null>(null);

  // Direct Chat Dialer State
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directMessage, setDirectMessage] = useState<string>('');

  // Snippets Form State
  const [newShortcut, setNewShortcut] = useState<string>('');
  const [newSnippetTitle, setNewSnippetTitle] = useState<string>('');
  const [newSnippetContent, setNewSnippetContent] = useState<string>('');
  const [showAddSnippet, setShowAddSnippet] = useState<boolean>(false);

  // Reminder Form State
  const [reminderTarget, setReminderTarget] = useState<string>('');
  const [reminderNote, setReminderNote] = useState<string>('Follow up on pending conversation');
  const [reminderHours, setReminderHours] = useState<number>(2);

  // UI status
  const [toast, setToast] = useState<string | null>(null);
  const [isWaOpen, setIsWaOpen] = useState<boolean>(false);

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => setNowEpoch(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync data on tab change
  useEffect(() => {
    loadAllData();
    checkWhatsAppTab();
  }, [activeTab]);

  const loadAllData = async () => {
    const [msgList, snipList, remList, setts] = await Promise.all([
      getScheduledMessages(),
      getQuickSnippets(),
      getFollowUpReminders(),
      getAppSettings(),
    ]);
    setMessages(msgList);
    setSnippets(snipList);
    setReminders(remList);
    setSettings(setts);
  };

  const checkWhatsAppTab = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
      setIsWaOpen(tabs.length > 0);
    }
  };

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };

  // Presets
  const handleMidnightPreset = () => {
    setScheduleTime('00:00');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    showToast('Applied: 12:00 AM Midnight Preset 🌙');
  };

  const handleRelativePreset = (minutes: number, label: string) => {
    const future = new Date(Date.now() + minutes * 60 * 1000);
    const dateStr = future.toISOString().split('T')[0];
    const hours = String(future.getHours()).padStart(2, '0');
    const mins = String(future.getMinutes()).padStart(2, '0');
    setScheduleDate(dateStr);
    setScheduleTime(`${hours}:${mins}`);
    showToast(`Applied: In ${label}`);
  };

  // Use Current Chat from WhatsApp Tab
  const handleUseCurrentChat = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
        if (tabs.length === 0) {
          showToast('WhatsApp Web tab is not open!');
          return;
        }
        const activeTab = tabs[0];
        if (activeTab.id) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'GET_ACTIVE_CHAT' }, (response) => {
            if (response && response.chatTitle) {
              setRecipient(response.chatTitle);
              setReminderTarget(response.chatTitle);
              showToast(`Linked: ${response.chatTitle}`);
            } else {
              setRecipient('Active WhatsApp Chat');
              showToast('Active Chat selected');
            }
          });
        }
      }
    } catch {
      setRecipient('Active WhatsApp Chat');
    }
  };

  // AI Tone Polisher
  const handleApplyAIPolish = (tone: AITone) => {
    const targetName = isBatchMode ? 'Friend' : (recipient || 'Friend');
    const polished = polishMessage(message, tone, targetName);
    setMessage(polished);
    showToast(`✨ Applied ${tone} tone polish!`);
  };

  // Attachment handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large (Max 5MB for local storage preview)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        id: 'att_' + Date.now(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result as string,
      });
      showToast(`📎 Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Schedule Submit (Handles Single or Batch)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please enter a message to schedule');
      return;
    }

    const targetDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    const scheduledEpoch = targetDateTime.getTime();

    if (isNaN(scheduledEpoch) || scheduledEpoch <= Date.now()) {
      showToast('Selected time must be in the future!');
      return;
    }

    if (isBatchMode) {
      const list = batchRecipients
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (list.length === 0) {
        showToast('Please enter at least one recipient phone number');
        return;
      }

      await scheduleBatchMessages(
        list,
        message.trim(),
        scheduledEpoch,
        useHumanDelay,
        attachment ? [attachment] : undefined
      );

      showToast(`✓ Batch Scheduled! ${list.length} messages queued with safe delays.`);
    } else {
      if (!recipient.trim()) {
        showToast('Please enter a recipient contact or phone number');
        return;
      }

      const newMessage: ScheduledMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        recipient: recipient.trim(),
        message: message.trim(),
        scheduledTime: scheduledEpoch,
        status: 'pending',
        createdAt: Date.now(),
        useHumanDelay,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        attachments: attachment ? [attachment] : undefined,
      };

      await saveScheduledMessage(newMessage);
      showToast('✓ Successfully Scheduled! Saved in Local Queue.');
    }

    await loadAllData();
    setTimeout(() => setActiveTab('queue'), 600);
  };

  // Direct Click-to-Chat without saving number
  const handleOpenDirectChat = async () => {
    const cleanDigits = directPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      showToast('Please enter a valid 10+ digit phone number with country code');
      return;
    }

    const url = directMessage.trim()
      ? `https://web.whatsapp.com/send?phone=${cleanDigits}&text=${encodeURIComponent(directMessage)}`
      : `https://web.whatsapp.com/send?phone=${cleanDigits}`;

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
      if (tabs.length > 0 && tabs[0].id) {
        await chrome.tabs.update(tabs[0].id, { url, active: true });
        showToast(`Opening chat with +${cleanDigits}...`);
      } else {
        await chrome.tabs.create({ url, active: true });
        showToast(`Opening WhatsApp Web for +${cleanDigits}...`);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  // Add Snippet
  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.startsWith('/')) {
      showToast('Shortcut must start with a slash (e.g. /upi)');
      return;
    }
    if (!newSnippetContent.trim()) {
      showToast('Snippet content cannot be empty');
      return;
    }

    const item: QuickSnippet = {
      id: 'snip_' + Date.now(),
      shortcut: newShortcut.trim(),
      title: newSnippetTitle.trim() || newShortcut,
      content: newSnippetContent.trim(),
    };

    await saveQuickSnippet(item);
    setNewShortcut('');
    setNewSnippetTitle('');
    setNewSnippetContent('');
    setShowAddSnippet(false);
    await loadAllData();
    showToast(`✓ Snippet ${item.shortcut} saved!`);
  };

  // Save Follow-Up Reminder
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTarget.trim()) {
      showToast('Please enter target contact name or chat');
      return;
    }

    const remindEpoch = Date.now() + reminderHours * 60 * 60 * 1000;
    const item: FollowUpReminder = {
      id: 'rem_' + Date.now(),
      chatTitle: reminderTarget.trim(),
      note: reminderNote.trim() || 'Follow up on conversation',
      remindAt: remindEpoch,
      status: 'pending',
      createdAt: Date.now(),
    };

    await saveFollowUpReminder(item);
    await loadAllData();
    showToast(`✓ Reminder set for ${new Date(remindEpoch).toLocaleTimeString()}!`);
  };

  const formatCountdown = (targetEpoch: number) => {
    const diff = targetEpoch - nowEpoch;
    if (diff <= 0) return 'Triggering now...';
    const totalSecs = Math.floor(diff / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const pendingMessages = messages.filter((m) => m.status === 'pending');
  const historyMessages = messages.filter((m) => m.status !== 'pending');
  const pendingReminders = reminders.filter((r) => r.status === 'pending');

  return (
    <div className="flex flex-col min-h-screen bg-[#08090D] text-slate-200">
      
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-[#0F121A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-600/40 font-bold">
            <Clock className="w-3.5 h-3.5 text-[#CCFF00]" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              ChronoWA <span className="text-[9px] font-mono px-1 py-0.2 bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 rounded font-bold">PRO</span>
            </h1>
            <p className="text-[9px] text-slate-400">All-in-One WhatsApp Suite</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isWaOpen ? 'bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]' : 'bg-amber-400'}`} />
          <span className="text-[10px] text-slate-300 font-medium">{isWaOpen ? 'WA Linked' : 'WA Offline'}</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex p-1 mx-2.5 my-1.5 bg-[#151924] rounded-xl border border-white/5 overflow-x-auto gap-0.5 no-scrollbar">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'schedule' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#CCFF00]" /> Schedule
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'direct' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PhoneCall className="w-3 h-3 text-[#60A5FA]" /> Direct Chat
        </button>

        <button
          onClick={() => setActiveTab('snippets')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'snippets' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3 h-3 text-[#CCFF00]" /> Snippets
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'reminders' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3 h-3 text-amber-400" />
          Reminders {pendingReminders.length > 0 && <span className="text-[8px] bg-amber-400 text-black px-1 rounded-full font-bold">{pendingReminders.length}</span>}
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'queue' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Queue {pendingMessages.length > 0 && <span className="text-[8px] bg-[#CCFF00] text-black px-1 rounded-full font-bold">{pendingMessages.length}</span>}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'history' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3 h-3" /> Log
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3 h-3" />
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="mx-3 mb-1.5 p-2 bg-[#CCFF00]/15 border border-[#CCFF00]/40 rounded-xl text-center">
          <p className="text-[10px] font-semibold text-[#CCFF00]">{toast}</p>
        </div>
      )}

      {/* TAB 1: SCHEDULE FORM (SINGLE & BATCH) */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleScheduleSubmit} className="px-3 pb-3 space-y-2.5 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2.5">
            
            {/* Mode Switcher: Single vs Batch */}
            <div className="flex items-center justify-between p-1 bg-[#151924] rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setIsBatchMode(false)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded transition-colors ${!isBatchMode ? 'bg-[#2563EB] text-white' : 'text-slate-400'}`}
              >
                Single Recipient
              </button>
              <button
                type="button"
                onClick={() => setIsBatchMode(true)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded transition-colors flex items-center justify-center gap-1 ${isBatchMode ? 'bg-[#2563EB] text-white' : 'text-slate-400'}`}
              >
                <Users className="w-3 h-3 text-[#CCFF00]" /> Batch Mode (Multi)
              </button>
            </div>

            {/* Recipient Input */}
            {!isBatchMode ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Target Contact / Phone</label>
                  <button type="button" onClick={handleUseCurrentChat} className="text-[10px] text-[#60A5FA] hover:underline">Use Open Chat 🎯</button>
                </div>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+9198XXXXXXXX or Contact Name"
                  className="w-full bg-[#151924] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block mb-1">
                  Batch Phone Numbers <span className="text-[#CCFF00] lowercase font-normal">(comma or line separated)</span>
                </label>
                <textarea
                  rows={2}
                  value={batchRecipients}
                  onChange={(e) => setBatchRecipients(e.target.value)}
                  placeholder="+919876543210, +919123456789, +919988776655"
                  className="w-full bg-[#151924] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono resize-none focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <div className="grid grid-cols-4 gap-1">
                <button type="button" onClick={() => handleRelativePreset(120, '2h')} className="px-1 py-1.5 bg-[#151924] hover:bg-[#2563EB]/20 border border-white/5 rounded-lg text-[10px] text-slate-300 text-center">
                  ⏱️ +2 Hours
                </button>
                <button type="button" onClick={handleMidnightPreset} className="px-1 py-1.5 bg-[#151924] hover:bg-[#CCFF00]/10 border border-white/5 rounded-lg text-[10px] font-bold text-[#CCFF00] text-center">
                  🌙 12:00 AM
                </button>
                <button type="button" onClick={() => handleRelativePreset(60, '1h')} className="px-1 py-1.5 bg-[#151924] hover:bg-[#2563EB]/20 border border-white/5 rounded-lg text-[10px] text-slate-300 text-center">
                  ⏱️ +1 Hour
                </button>
                <button type="button" onClick={() => handleRelativePreset(15, '15m')} className="px-1 py-1.5 bg-[#151924] hover:bg-[#2563EB]/20 border border-white/5 rounded-lg text-[10px] text-slate-300 text-center">
                  ⏱️ +15 Mins
                </button>
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-[#151924] border border-white/10 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">Time (24h)</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-[#151924] border border-white/10 rounded-xl px-2 py-1 text-xs font-mono font-bold text-[#CCFF00] focus:outline-none focus:border-[#CCFF00]"
                />
              </div>
            </div>

            {/* Message Body & AI Tone Polisher Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Message</label>
                <div className="flex gap-1 items-center">
                  <span className="text-[9px] text-[#CCFF00] flex items-center gap-0.5"><Wand2 className="w-2.5 h-2.5" /> AI Polish:</span>
                  <button type="button" onClick={() => handleApplyAIPolish('professional')} className="text-[9px] px-1 py-0.5 bg-[#151924] text-[#60A5FA] rounded border border-white/5 hover:bg-blue-600/30">Work</button>
                  <button type="button" onClick={() => handleApplyAIPolish('celebratory')} className="text-[9px] px-1 py-0.5 bg-[#151924] text-[#CCFF00] rounded border border-white/5 hover:bg-lime-500/30">B'day</button>
                  <button type="button" onClick={() => handleApplyAIPolish('friendly')} className="text-[9px] px-1 py-0.5 bg-[#151924] text-slate-300 rounded border border-white/5 hover:bg-white/10">Casual</button>
                </div>
              </div>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full bg-[#151924] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            {/* Attachment preview / upload */}
            <div className="flex items-center justify-between p-2 bg-[#151924]/60 rounded-xl border border-white/5">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 hover:text-white">
                <Paperclip className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>{attachment ? attachment.name : 'Attach Media / File (Optional)'}</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              {attachment && (
                <button type="button" onClick={() => setAttachment(null)} className="text-[10px] text-red-400 hover:underline">
                  Remove
                </button>
              )}
            </div>

            {/* Safe Anti-Ban Toggle */}
            <label className="flex items-center justify-between p-2 bg-[#151924]/60 rounded-xl border border-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span className="text-[10px] font-medium text-slate-200">Anti-Ban Typing Jitter & Stagger</span>
              </div>
              <input
                type="checkbox"
                checked={useHumanDelay}
                onChange={(e) => setUseHumanDelay(e.target.checked)}
                className="accent-[#CCFF00] w-3.5 h-3.5 cursor-pointer"
              />
            </label>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-2 px-4 bg-[#2563EB] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span className="text-xs">{isBatchMode ? 'Schedule Batch Campaign 🚀' : 'Schedule Message Dispatch'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: DIRECT CHAT DIALER (NO NUMBER SAVING) */}
      {activeTab === 'direct' && (
        <div className="px-3 pb-3 space-y-3 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="p-3 bg-[#151924] rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <PhoneCall className="w-4 h-4 text-[#60A5FA]" />
                Direct Chat Without Saving Contact
              </div>
              <p className="text-[10px] text-slate-400">
                Instantly chat with anyone by entering their number. Zero clutter in your phone book.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                Phone Number (with Country Code)
              </label>
              <input
                type="text"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210 or 919876543210"
                className="w-full bg-[#151924] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                Pre-Filled Message (Optional)
              </label>
              <textarea
                rows={3}
                value={directMessage}
                onChange={(e) => setDirectMessage(e.target.value)}
                placeholder="Hi, reaching out regarding..."
                className="w-full bg-[#151924] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#2563EB] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenDirectChat}
                className="py-2.5 px-3 bg-[#2563EB] hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#CCFF00]" />
                Open Chat Now
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipient(directPhone);
                  setMessage(directMessage || 'Hello!');
                  setActiveTab('schedule');
                }}
                className="py-2.5 px-3 bg-[#151924] hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
                Schedule Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SNIPPETS / CANNED RESPONSES */}
      {activeTab === 'snippets' && (
        <div className="px-3 pb-3 space-y-2.5 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>{snippets.length} Saved Snippets (Type /shortcut in chat)</span>
              <button
                onClick={() => setShowAddSnippet(!showAddSnippet)}
                className="text-[#CCFF00] hover:underline flex items-center gap-1 font-bold"
              >
                <Plus className="w-3 h-3" /> Add Snippet
              </button>
            </div>

            {/* Add New Snippet Form */}
            {showAddSnippet && (
              <form onSubmit={handleCreateSnippet} className="p-3 bg-[#151924] rounded-xl border border-[#CCFF00]/30 space-y-2">
                <div className="text-xs font-bold text-white">Create New Slash Snippet</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newShortcut}
                    onChange={(e) => setNewShortcut(e.target.value)}
                    placeholder="Shortcut (e.g. /upi)"
                    className="bg-[#0F121A] border border-white/10 rounded-lg px-2 py-1 text-xs text-[#CCFF00] font-mono"
                  />
                  <input
                    type="text"
                    value={newSnippetTitle}
                    onChange={(e) => setNewSnippetTitle(e.target.value)}
                    placeholder="Title (e.g. UPI ID)"
                    className="bg-[#0F121A] border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={2}
                  value={newSnippetContent}
                  onChange={(e) => setNewSnippetContent(e.target.value)}
                  placeholder="Full text that will be auto-inserted..."
                  className="w-full bg-[#0F121A] border border-white/10 rounded-lg p-2 text-xs text-white resize-none"
                />
                <button type="submit" className="w-full py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg">
                  Save Snippet
                </button>
              </form>
            )}

            {snippets.map((snip) => (
              <div key={snip.id} className="p-2.5 bg-[#151924] rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#CCFF00]">{snip.shortcut}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">{snip.title}</span>
                    <button
                      onClick={async () => {
                        await deleteQuickSnippet(snip.id);
                        await loadAllData();
                        showToast('Snippet deleted');
                      }}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2">{snip.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FOLLOW-UP REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="px-3 pb-3 space-y-2.5 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2.5">
            <div className="p-2.5 bg-[#151924] rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" /> Set Self Follow-Up Reminder
              </div>
              <input
                type="text"
                value={reminderTarget}
                onChange={(e) => setReminderTarget(e.target.value)}
                placeholder="Contact Name or Client"
                className="w-full bg-[#0F121A] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <input
                type="text"
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="Reminder Note (e.g. Call regarding invoice)"
                className="w-full bg-[#0F121A] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <div className="flex items-center justify-between gap-1">
                <button type="button" onClick={() => setReminderHours(1)} className={`flex-1 py-1 text-[10px] rounded border ${reminderHours === 1 ? 'bg-[#2563EB] text-white border-blue-500' : 'bg-[#0F121A] text-slate-300 border-white/5'}`}>1 Hour</button>
                <button type="button" onClick={() => setReminderHours(2)} className={`flex-1 py-1 text-[10px] rounded border ${reminderHours === 2 ? 'bg-[#2563EB] text-white border-blue-500' : 'bg-[#0F121A] text-slate-300 border-white/5'}`}>2 Hours</button>
                <button type="button" onClick={() => setReminderHours(24)} className={`flex-1 py-1 text-[10px] rounded border ${reminderHours === 24 ? 'bg-[#2563EB] text-white border-blue-500' : 'bg-[#0F121A] text-slate-300 border-white/5'}`}>Tomorrow</button>
              </div>
              <button
                onClick={handleCreateReminder}
                className="w-full py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded-lg shadow"
              >
                Save Reminder Alert
              </button>
            </div>

            <div className="text-[10px] text-slate-400 px-1">Active Follow-Up Alarms ({pendingReminders.length})</div>
            {pendingReminders.map((r) => (
              <div key={r.id} className="p-2.5 bg-[#151924] rounded-xl border border-amber-400/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{r.chatTitle}</span>
                  <span className="text-[10px] font-mono text-amber-400">{new Date(r.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-slate-300">{r.note}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px]">
                  <span className="text-amber-400">T-minus: {formatCountdown(r.remindAt)}</span>
                  <button
                    onClick={async () => {
                      await deleteFollowUpReminder(r.id);
                      await loadAllData();
                      showToast('Reminder cleared');
                    }}
                    className="text-slate-400 hover:text-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUEUE */}
      {activeTab === 'queue' && (
        <div className="px-3 pb-3 space-y-2 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>{pendingMessages.length} Messages in Active Queue</span>
              <button onClick={loadAllData} className="text-[#60A5FA] hover:underline flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" /> Refresh
              </button>
            </div>

            {pendingMessages.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">Queue is currently clear.</p>
              </div>
            ) : (
              pendingMessages.map((item) => {
                const dateObj = new Date(item.scheduledTime);
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const countdown = formatCountdown(item.scheduledTime);

                return (
                  <div key={item.id} className="p-3 bg-[#0F121A] rounded-xl border border-[#CCFF00]/30 shadow-[0_0_12px_rgba(204,255,0,0.06)] relative overflow-hidden space-y-1.5">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#CCFF00]" />
                    <div className="flex items-center justify-between pl-1">
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">{item.recipient}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
                          {timeString}
                        </span>
                        <button onClick={() => deleteScheduledMessage(item.id).then(loadAllData)} className="text-slate-500 hover:text-red-400 p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 pl-1 line-clamp-2">"{item.message}"</p>
                    <div className="flex items-center justify-between pl-1 pt-1 border-t border-white/5 text-[9px]">
                      <span className="text-[#CCFF00] font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                        T-minus: {countdown}
                      </span>
                      {item.attachments && <span className="text-[#60A5FA]">📎 Has Media</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: HISTORY */}
      {activeTab === 'history' && (
        <div className="px-3 pb-3 space-y-2 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>{historyMessages.length} Delivered Messages</span>
              <button onClick={() => clearCompletedMessages().then(loadAllData)} className="text-[#60A5FA] hover:underline">
                Clear
              </button>
            </div>
            {historyMessages.map((item) => {
              const isSent = item.status === 'sent';
              const dateObj = new Date(item.sentAt || item.scheduledTime);
              return (
                <div key={item.id} className={`p-2.5 bg-[#0F121A] rounded-xl border relative overflow-hidden space-y-1 ${isSent ? 'border-white/5' : 'border-red-500/20'}`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isSent ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="flex items-center justify-between pl-1">
                    <span className="text-xs font-bold text-white">{item.recipient}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pl-1 line-clamp-1">"{item.message}"</p>
                  <div className="flex items-center justify-between pl-1 pt-1 border-t border-white/5 text-[9px]">
                    <span className={isSent ? 'text-emerald-400 flex items-center gap-1' : 'text-red-400'}>
                      {isSent ? <><CheckCircle2 className="w-2.5 h-2.5" /> Sent</> : item.error || 'Failed'}
                    </span>
                    {!isSent && (
                      <button onClick={() => rescheduleMessage(item.id, Date.now() + 60000).then(loadAllData)} className="text-[#60A5FA] hover:underline">
                        Retry Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: CONFIG */}
      {activeTab === 'settings' && (
        <div className="px-3 pb-3 space-y-3 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Engine Settings</h2>
            
            <div className="p-3 bg-[#151924] rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Auto-Wake WhatsApp Tab</span>
                <input
                  type="checkbox"
                  checked={settings.autoWakeTab}
                  onChange={(e) => saveAppSettings({ autoWakeTab: e.target.checked }).then(setSettings)}
                  className="accent-[#CCFF00] w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">Open WhatsApp in background if closed when trigger fires.</p>
            </div>

            <div className="p-3 bg-[#151924] rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Batch Interval Delay</span>
                <span className="text-xs font-mono text-[#CCFF00]">{settings.batchDelaySeconds}s</span>
              </div>
              <p className="text-[10px] text-slate-400">Interval between multi-recipient dispatches to avoid spam detection.</p>
            </div>

            <div className="p-3 bg-[#0F121A] rounded-xl border border-[#CCFF00]/20 space-y-1 text-center">
              <ShieldCheck className="w-5 h-5 mx-auto text-[#CCFF00]" />
              <div className="text-xs font-bold text-white">100% Free & Local Privacy</div>
              <p className="text-[10px] text-slate-400">Zero telemetry. All snippets, contacts and schedules stay on your machine.</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-[#0F121A] border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500">
        <span>Zero Cloud • 100% Free</span>
        <span className="text-[#CCFF00] font-mono">v1.2.0 Pro</span>
      </div>

    </div>
  );
}
