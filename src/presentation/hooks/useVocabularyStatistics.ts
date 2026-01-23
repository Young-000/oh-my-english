'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MasteryDistribution {
  level: number;
  label: string;
  count: number;
}

export interface DailyProgress {
  date: string;
  itemsMastered: number;
  totalItems: number;
}

export interface VocabularyStatistics {
  // Overall progress
  totalItems: number;
  studiedItems: number;
  masteredItems: number;
  averageMastery: number;

  // Items due for review
  dueForReview: number;

  // Study streak
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;

  // Daily goal
  dailyGoal: number;
  todayCompleted: number;

  // Charts data
  masteryDistribution: MasteryDistribution[];
  progressOverTime: DailyProgress[];
}

interface UseVocabularyStatisticsState {
  isLoading: boolean;
  error: string | null;
  statistics: VocabularyStatistics | null;
}

export function useVocabularyStatistics() {
  const [state, setState] = useState<UseVocabularyStatisticsState>({
    isLoading: true,
    error: null,
    statistics: null,
  });

  const fetchStatistics = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/vocabulary/statistics');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      const data = await response.json();
      setState({
        isLoading: false,
        error: null,
        statistics: data.statistics,
      });
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong',
        statistics: null,
      });
    }
  }, []);

  const refetch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    ...state,
    refetch,
  };
}
