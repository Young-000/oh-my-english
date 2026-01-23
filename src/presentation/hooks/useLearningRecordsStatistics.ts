'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MasteryDistribution {
  level: number;
  label: string;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface WeeklySummary {
  thisWeek: {
    recordsCreated: number;
    recordsReviewed: number;
    averageMastery: number;
  };
  lastWeek: {
    recordsCreated: number;
    recordsReviewed: number;
    averageMastery: number;
  };
  comparison: {
    recordsCreatedDiff: number;
    recordsCreatedDiffPercent: number;
    recordsReviewedDiff: number;
    recordsReviewedDiffPercent: number;
  };
}

export interface MonthlySummary {
  recordsCreated: number;
  recordsReviewed: number;
  averageMastery: number;
  daysActive: number;
}

export interface LearningRecordsStatistics {
  totalRecords: number;
  bookmarkedRecords: number;
  masteredRecords: number;
  dueForReview: number;
  averageMastery: number;
  categoryBreakdown: CategoryBreakdown[];
  masteryDistribution: MasteryDistribution[];
  dailyActivity: DailyActivity[];
  weeklySummary: WeeklySummary;
  monthlySummary: MonthlySummary;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

interface UseLearningRecordsStatisticsState {
  isLoading: boolean;
  error: string | null;
  statistics: LearningRecordsStatistics | null;
}

export function useLearningRecordsStatistics() {
  const [state, setState] = useState<UseLearningRecordsStatisticsState>({
    isLoading: true,
    error: null,
    statistics: null,
  });

  const fetchStatistics = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/learning-records/statistics');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      const data = await response.json();
      setState({
        isLoading: false,
        error: null,
        statistics: data.data,
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
