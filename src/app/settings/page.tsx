'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  User,
  Settings,
  Bell,
  BellOff,
  Target,
  LogOut,
  Trash2,
  AlertTriangle,
  Check,
  Mail,
  Clock,
} from 'lucide-react';
import { useUserProfile, type UserSettings } from '@/presentation/hooks/useUserProfile';
import { useNotifications } from '@/presentation/hooks/useNotifications';
import type { NotificationPreferences } from '@/lib/notifications/push-notification';

const DAILY_GOALS = [
  { value: 5, label: '5', description: '가볍게' },
  { value: 10, label: '10', description: '적당히' },
  { value: 15, label: '15', description: '열심히' },
  { value: 20, label: '20', description: '집중적으로' },
];

const NOTIFICATION_FREQUENCIES: { value: NotificationPreferences['frequency']; label: string; description: string }[] = [
  { value: 'realtime', label: '실시간', description: '복습 대기 시 바로 알림' },
  { value: 'hourly', label: '1시간마다', description: '시간당 최대 1회' },
  { value: 'daily', label: '하루 1회', description: '하루에 1회만 알림' },
];

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  email: 'Email',
  github: 'GitHub',
  apple: 'Apple',
};

function getProviderIcon(provider: string): React.ReactNode {
  switch (provider) {
    case 'google':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      );
    case 'email':
      return <Mail className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    isLoading,
    isSaving,
    error,
    isAuthenticated,
    profile,
    updateProfile,
    logout,
    deleteAccount,
    clearError,
  } = useUserProfile();

  // Notification state
  const {
    isSupported: isNotificationSupported,
    permission: notificationPermission,
    preferences: notificationPreferences,
    dueCount,
    requestPermission: requestNotificationPermission,
    updatePreferences: updateNotificationPreferences,
    sendTestNotification,
  } = useNotifications();

  // Track whether user has made edits (to distinguish from initial profile load)
  const [formState, setFormState] = useState<{
    initialized: boolean;
    profileId: string | null;
    displayName: string;
    dailyGoal: number;
    notificationEnabled: boolean;
    formEdited: boolean;
  }>({
    initialized: false,
    profileId: null,
    displayName: '',
    dailyGoal: 10,
    notificationEnabled: false,
    formEdited: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync form state with profile when profile changes
  // This is the recommended pattern: derive initial state from props
  const currentFormState = useMemo(() => {
    if (profile && (!formState.initialized || formState.profileId !== profile.id)) {
      return {
        initialized: true,
        profileId: profile.id,
        displayName: profile.displayName || '',
        dailyGoal: profile.settings.dailyGoal,
        notificationEnabled: profile.settings.notificationEnabled,
        formEdited: false,
      };
    }
    return formState;
  }, [profile, formState]);

  // Update form state only when it actually differs
  const needsSync = currentFormState !== formState;
  if (needsSync) {
    setFormState(currentFormState);
  }

  // Destructure for easier use
  const { displayName, dailyGoal, notificationEnabled, formEdited } = currentFormState;

  // Compute hasChanges as derived state
  const hasChanges = useMemo(() => {
    if (!profile || !formEdited) return false;
    return (
      displayName !== (profile.displayName || '') ||
      dailyGoal !== profile.settings.dailyGoal ||
      notificationEnabled !== profile.settings.notificationEnabled
    );
  }, [displayName, dailyGoal, notificationEnabled, profile, formEdited]);

  // Handle form field changes
  const handleDisplayNameChange = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, displayName: value, formEdited: true }));
  }, []);

  const handleDailyGoalChange = useCallback((value: number) => {
    setFormState((prev) => ({ ...prev, dailyGoal: value, formEdited: true }));
  }, []);

  const handleNotificationChange = useCallback((value: boolean) => {
    setFormState((prev) => ({ ...prev, notificationEnabled: value, formEdited: true }));
  }, []);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [isLoading, isAuthenticated, router]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSaveProfile = async () => {
    clearError();
    const updates: {
      displayName?: string;
      settings?: Partial<UserSettings>;
    } = {};

    if (displayName !== (profile?.displayName || '')) {
      updates.displayName = displayName;
    }

    if (
      dailyGoal !== profile?.settings.dailyGoal ||
      notificationEnabled !== profile?.settings.notificationEnabled
    ) {
      updates.settings = {
        dailyGoal,
        notificationEnabled,
      };
    }

    const success = await updateProfile(updates);
    if (success) {
      setSuccessMessage('설정이 저장되었습니다.');
      setFormState((prev) => ({ ...prev, formEdited: false }));
    }
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정 삭제') return;

    const success = await deleteAccount();
    if (success) {
      router.push('/');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Not authenticated (will redirect)
  if (!isAuthenticated || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
            <h1 className="text-lg font-bold">설정</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto"
              >
                닫기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-green-800 dark:text-green-200 text-sm">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              프로필
            </CardTitle>
            <CardDescription>내 계정 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">표시 이름</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
            </div>

            {/* Connected Providers */}
            <div className="space-y-2">
              <Label>연결된 계정</Label>
              <div className="flex flex-wrap gap-2">
                {profile.providers.map((provider) => (
                  <Badge
                    key={provider}
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1.5"
                  >
                    {getProviderIcon(provider)}
                    {PROVIDER_LABELS[provider] || provider}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              학습 설정
            </CardTitle>
            <CardDescription>학습 목표와 알림을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Goal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Label>일일 학습 목표</Label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DAILY_GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => handleDailyGoalChange(goal.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                      dailyGoal === goal.value
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <span className="text-lg font-bold">{goal.label}</span>
                    <span className="text-xs text-muted-foreground">{goal.description}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                하루에 학습할 표현의 개수를 설정합니다.
              </p>
            </div>

            {/* Profile Notification Toggle (for profile settings) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="notifications" className="cursor-pointer">
                    알림 받기
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    학습 리마인더와 복습 알림을 받습니다
                  </p>
                </div>
              </div>
              <Switch
                id="notifications"
                checked={notificationEnabled}
                onCheckedChange={handleNotificationChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Browser Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              복습 알림 설정
            </CardTitle>
            <CardDescription>
              브라우저 알림으로 복습 시간을 놓치지 마세요
              {dueCount > 0 && (
                <span className="ml-2 text-primary font-medium">
                  (현재 {dueCount}개 복습 대기 중)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Browser Support Status */}
            {!isNotificationSupported ? (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BellOff className="h-4 w-4" />
                  <span className="text-sm">이 브라우저는 알림을 지원하지 않습니다.</span>
                </div>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <BellOff className="h-4 w-4" />
                  <span className="text-sm font-medium">알림이 차단되었습니다</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  브라우저 설정에서 이 사이트의 알림 권한을 허용해주세요.
                </p>
              </div>
            ) : (
              <>
                {/* Enable/Disable Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {notificationPreferences.enabled ? (
                      <Bell className="h-4 w-4 text-green-600" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="browser-notifications" className="cursor-pointer">
                        브라우저 알림
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {notificationPermission === 'granted'
                          ? '복습할 항목이 있을 때 알림을 받습니다'
                          : '알림 권한을 허용해주세요'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="browser-notifications"
                    checked={notificationPreferences.enabled}
                    onCheckedChange={async (checked) => {
                      if (checked && notificationPermission !== 'granted') {
                        const result = await requestNotificationPermission();
                        if (result === 'granted') {
                          updateNotificationPreferences({ enabled: true });
                        }
                      } else {
                        updateNotificationPreferences({ enabled: checked });
                      }
                    }}
                  />
                </div>

                {/* Notification Frequency */}
                {notificationPreferences.enabled && notificationPermission === 'granted' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>알림 빈도</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {NOTIFICATION_FREQUENCIES.map((freq) => (
                        <button
                          key={freq.value}
                          type="button"
                          onClick={() => updateNotificationPreferences({ frequency: freq.value })}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                            notificationPreferences.frequency === freq.value
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                        >
                          <span className="text-sm font-medium">{freq.label}</span>
                          <span className="text-xs text-muted-foreground text-center">
                            {freq.description}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      복습할 항목이 있을 때 알림을 받을 빈도를 설정합니다.
                    </p>
                  </div>
                )}

                {/* Test Notification Button */}
                {notificationPreferences.enabled && notificationPermission === 'granted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    className="w-full"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    테스트 알림 보내기
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full"
          onClick={handleSaveProfile}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              저장 중...
            </>
          ) : (
            '변경사항 저장'
          )}
        </Button>

        {/* Logout Section */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              위험 구역
            </CardTitle>
            <CardDescription>
              계정을 삭제하면 모든 학습 기록이 영구적으로 삭제됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                계정 삭제
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                  <p className="text-sm text-destructive font-medium mb-2">
                    정말 계정을 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    이 작업은 되돌릴 수 없습니다. 모든 학습 기록, 단어장, 퀴즈 기록이 영구적으로
                    삭제됩니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deleteConfirm">
                    확인을 위해 <span className="font-bold">계정 삭제</span>를 입력하세요
                  </Label>
                  <Input
                    id="deleteConfirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="계정 삭제"
                    className="border-destructive/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== '계정 삭제' || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        삭제 중...
                      </>
                    ) : (
                      '영구 삭제'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8">
          <p>
            가입일: {new Date(profile.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </main>
    </div>
  );
}
