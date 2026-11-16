export type MessageStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface MediaAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // base64 preview/data
}

export interface ScheduledMessage {
  id: string;
  recipient: string;          // Phone number (+91XXXXXXXXXX) or contact name
  message: string;            // Text content, can contain variables like {name}, {time}, {date}
  scheduledTime: number;      // Epoch millisecond timestamp
  status: MessageStatus;
  createdAt: number;
  sentAt?: number;
  error?: string;
  useHumanDelay: boolean;     // Enable random human typing jitter (anti-ban safe)
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  retryCount?: number;
  attachments?: MediaAttachment[];
  batchGroupId?: string;      // Identifies batch campaigns
}

export interface QuickSnippet {
  id: string;
  shortcut: string;           // E.g., "/upi", "/address", "/pricing"
  title: string;
  content: string;
}

export interface FollowUpReminder {
  id: string;
  chatTitle: string;
  phone?: string;
  note: string;
  remindAt: number;           // Epoch timestamp for notification
  status: 'pending' | 'completed' | 'dismissed';
  createdAt: number;
}

export interface AppSettings {
  autoWakeTab: boolean;       // Automatically open WhatsApp Web if closed
  antiBanJitterMinMs: number; // Minimum typing delay (default: 1500ms)
  antiBanJitterMaxMs: number; // Maximum typing delay (default: 3500ms)
  batchDelaySeconds: number;  // Interval between batch messages (default: 10s)
  desktopNotifications: boolean;
  soundAlerts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoWakeTab: true,
  antiBanJitterMinMs: 1500,
  antiBanJitterMaxMs: 3500,
  batchDelaySeconds: 10,
  desktopNotifications: true,
  soundAlerts: true,
};

export type ActiveTab = 'schedule' | 'direct' | 'snippets' | 'reminders' | 'queue' | 'history' | 'settings';

export type AITone = 'professional' | 'celebratory' | 'friendly' | 'urgent_polite';
