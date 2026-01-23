'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DueReviewsResponse } from '@/app/api/notifications/due-reviews/route';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendReviewReminderNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  shouldSendNotification,
  updateLastNotificationTime,
  type NotificationPermissionStatus,
  type NotificationPreferences,
} from '@/lib/notifications/push-notification';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface UseNotificationsState {
  isSupported: boolean;
  permission: NotificationPermissionStatus;
  preferences: NotificationPreferences;
  dueCount: number;
  nextReviewAt: string | null;
  breakdown: {
    learningRecords: number;
    vocabularyItems: number;
  };
  isLoading: boolean;
  error: string | null;
}

export interface UseNotificationsReturn extends UseNotificationsState {
  requestPermission: () => Promise<NotificationPermissionStatus>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  refreshDueCount: () => Promise<void>;
  sendTestNotification: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<UseNotificationsState>({
    isSupported: false,
    permission: 'default',
    preferences: {
      enabled: false,
      frequency: 'hourly',
      lastNotificationAt: null,
    },
    dueCount: 0,
    nextReviewAt: null,
    breakdown: {
      learningRecords: 0,
      vocabularyItems: 0,
    },
    isLoading: true,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDueCountRef = useRef<number>(0);

  // Initialize notification support and preferences
  useEffect(() => {
    const supported = isNotificationSupported();
    const permission = getNotificationPermission();
    const preferences = getNotificationPreferences();

    setState((prev) => ({
      ...prev,
      isSupported: supported,
      permission,
      preferences,
    }));
  }, []);

  // Fetch due reviews count
  const fetchDueReviews = useCallback(async (sendNotificationIfNeeded = false) => {
    try {
      const response = await fetch('/api/notifications/due-reviews');

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, silently ignore
          setState((prev) => ({
            ...prev,
            isLoading: false,
            dueCount: 0,
            nextReviewAt: null,
            breakdown: { learningRecords: 0, vocabularyItems: 0 },
          }));
          return;
        }
        throw new Error('Failed to fetch due reviews');
      }

      const data: DueReviewsResponse = await response.json();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        dueCount: data.dueCount,
        nextReviewAt: data.nextReviewAt,
        breakdown: data.breakdown,
      }));

      // Send notification if conditions are met
      if (
        sendNotificationIfNeeded &&
        data.dueCount > 0 &&
        data.dueCount > lastDueCountRef.current
      ) {
        const prefs = getNotificationPreferences();
        if (prefs.enabled && shouldSendNotification(prefs)) {
          const permission = getNotificationPermission();
          if (permission === 'granted') {
            sendReviewReminderNotification(data.dueCount);
            updateLastNotificationTime();
          }
        }
      }

      lastDueCountRef.current = data.dueCount;
    } catch (error) {
      console.error('Error fetching due reviews:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchDueReviews(false);

    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      fetchDueReviews(true);
    }, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchDueReviews]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    const permission = await requestNotificationPermission();
    setState((prev) => ({
      ...prev,
      permission,
    }));
    return permission;
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const updated = saveNotificationPreferences(updates);
    setState((prev) => ({
      ...prev,
      preferences: updated,
    }));
  }, []);

  // Manually refresh due count
  const refreshDueCount = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await fetchDueReviews(false);
  }, [fetchDueReviews]);

  // Send a test notification
  const sendTestNotification = useCallback(() => {
    const permission = getNotificationPermission();
    if (permission === 'granted') {
      sendReviewReminderNotification(state.dueCount || 5);
    }
  }, [state.dueCount]);

  return {
    ...state,
    requestPermission,
    updatePreferences,
    refreshDueCount,
    sendTestNotification,
  };
}
