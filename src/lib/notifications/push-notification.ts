/**
 * Browser Notification API helpers for Oh My English review reminders
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns The permission status after the request
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  // If already granted or denied, return current status
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Send a browser notification
 * @param options - Notification options
 * @returns The notification instance or null if not supported/permitted
 */
export function sendNotification(options: NotificationOptions): Notification | null {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/notification-icon.png',
      tag: options.tag || 'oh-my-english-notification',
      requireInteraction: options.requireInteraction ?? false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        options.onClick?.();
        notification.close();
      };
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send a review reminder notification
 * @param dueCount - Number of items due for review
 */
export function sendReviewReminderNotification(dueCount: number): Notification | null {
  if (dueCount <= 0) {
    return null;
  }

  const title = 'Oh My English! - 복습 알림';
  const body = dueCount === 1
    ? '복습할 표현이 1개 있습니다. 지금 복습하세요!'
    : `복습할 표현이 ${dueCount}개 있습니다. 지금 복습하세요!`;

  return sendNotification({
    title,
    body,
    tag: 'oh-my-english-review-reminder',
    requireInteraction: true,
    onClick: () => {
      // Focus or open the quiz page
      if (typeof window !== 'undefined') {
        window.focus();
        window.location.href = '/quiz';
      }
    },
  });
}

/**
 * Notification preference storage key
 */
const NOTIFICATION_PREFS_KEY = 'oh-my-english-notification-prefs';

export interface NotificationPreferences {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily';
  lastNotificationAt: string | null;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  frequency: 'hourly',
  lastNotificationAt: null,
};

/**
 * Get notification preferences from localStorage
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error reading notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences to localStorage
 */
export function saveNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): NotificationPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const current = getNotificationPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return getNotificationPreferences();
  }
}

/**
 * Check if enough time has passed to send another notification based on frequency
 */
export function shouldSendNotification(preferences: NotificationPreferences): boolean {
  if (!preferences.enabled) {
    return false;
  }

  if (!preferences.lastNotificationAt) {
    return true;
  }

  const lastNotification = new Date(preferences.lastNotificationAt);
  const now = new Date();
  const diffMs = now.getTime() - lastNotification.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  switch (preferences.frequency) {
    case 'realtime':
      return diffMinutes >= 5; // At most every 5 minutes
    case 'hourly':
      return diffMinutes >= 60;
    case 'daily':
      return diffMinutes >= 24 * 60;
    default:
      return false;
  }
}

/**
 * Update the last notification timestamp
 */
export function updateLastNotificationTime(): void {
  saveNotificationPreferences({
    lastNotificationAt: new Date().toISOString(),
  });
}
