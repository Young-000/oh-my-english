'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserSettings {
  dailyGoal: number;
  preferredStyle: 'casual' | 'neutral' | 'formal';
  notificationEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  settings: UserSettings;
  createdAt: string;
  providers: string[];
}

interface UseUserProfileState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  user: User | null;
  profile: UserProfile | null;
}

const DEFAULT_SETTINGS: UserSettings = {
  dailyGoal: 10,
  preferredStyle: 'neutral',
  notificationEnabled: false,
};

export function useUserProfile() {
  const [state, setState] = useState<UseUserProfileState>({
    isLoading: true,
    isSaving: false,
    error: null,
    user: null,
    profile: null,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        setState({
          isLoading: false,
          isSaving: false,
          error: null,
          user: null,
          profile: null,
        });
        return;
      }

      // Fetch profile from API
      const response = await fetch('/api/auth/profile');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch profile');
      }

      const data = await response.json();

      setState({
        isLoading: false,
        isSaving: false,
        error: null,
        user,
        profile: data.profile,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong',
      }));
    }
  }, [supabase.auth]);

  const updateProfile = useCallback(async (updates: {
    displayName?: string;
    settings?: Partial<UserSettings>;
  }): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        isSaving: false,
        profile: data.profile,
      }));

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Something went wrong',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        isLoading: false,
        isSaving: false,
        error: null,
        user: null,
        profile: null,
      });

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to logout',
      }));
      return false;
    }
  }, [supabase.auth]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out after deletion
      await supabase.auth.signOut();

      setState({
        isLoading: false,
        isSaving: false,
        error: null,
        user: null,
        profile: null,
      });

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Something went wrong',
      }));
      return false;
    }
  }, [supabase.auth]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setState({
          isLoading: false,
          isSaving: false,
          error: null,
          user: null,
          profile: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase.auth]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    defaultSettings: DEFAULT_SETTINGS,
    refetch: fetchProfile,
    updateProfile,
    logout,
    deleteAccount,
    clearError,
  };
}
