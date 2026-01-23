'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, BellOff, BookOpen, History, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/presentation/hooks/useNotifications';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    isSupported,
    permission,
    preferences,
    dueCount,
    breakdown,
    isLoading,
    requestPermission,
    updatePreferences,
    refreshDueCount,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle enabling notifications
  const handleEnableNotifications = async () => {
    if (!isSupported) return;

    const result = await requestPermission();
    if (result === 'granted') {
      updatePreferences({ enabled: true });
    }
  };

  // Handle disabling notifications
  const handleDisableNotifications = () => {
    updatePreferences({ enabled: false });
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      refreshDueCount();
    }
  };

  const isNotificationsEnabled = preferences.enabled && permission === 'granted';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className="relative"
        aria-label={`알림${dueCount > 0 ? ` - 복습 대기 ${dueCount}개` : ''}`}
      >
        {isNotificationsEnabled ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Badge for due count */}
        {dueCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center"
          >
            {dueCount > 99 ? '99+' : dueCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">복습 알림</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Due count summary */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : dueCount > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div>
                    <p className="font-medium text-primary">
                      {dueCount}개 복습 대기 중
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      지금 복습하여 기억을 강화하세요
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  {breakdown.learningRecords > 0 && (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium">{breakdown.learningRecords}</span>
                        <span className="text-muted-foreground"> 학습 기록</span>
                      </div>
                    </div>
                  )}
                  {breakdown.vocabularyItems > 0 && (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium">{breakdown.vocabularyItems}</span>
                        <span className="text-muted-foreground"> 단어장</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Quiz Button */}
                <Link href="/quiz" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    복습 시작하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium">모든 복습 완료!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  훌륭해요! 복습 대기 중인 항목이 없습니다.
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="border-t" />

            {/* Notification Settings */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                알림 설정
              </p>

              {!isSupported ? (
                <p className="text-sm text-muted-foreground">
                  이 브라우저는 알림을 지원하지 않습니다.
                </p>
              ) : permission === 'denied' ? (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">
                    알림이 차단되었습니다.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    브라우저 설정에서 알림 권한을 허용해주세요.
                  </p>
                </div>
              ) : !isNotificationsEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleEnableNotifications}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  알림 켜기
                </Button>
              ) : (
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-green-600" />
                    <span className="text-sm">알림 활성화됨</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisableNotifications}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    끄기
                  </Button>
                </div>
              )}

              {/* Link to full settings */}
              <Link
                href="/settings"
                className="block text-xs text-center text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                상세 설정
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
