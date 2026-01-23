'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Flame, BookOpen, Target, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useVocabularyStatistics, type VocabularyStatistics as VocabularyStatisticsType } from '@/presentation/hooks/useVocabularyStatistics';

const MASTERY_COLORS = [
  '#ef4444', // Level 0 - Red (New)
  '#f97316', // Level 1 - Orange (Learning)
  '#eab308', // Level 2 - Yellow (Familiar)
  '#22c55e', // Level 3 - Green (Good)
  '#14b8a6', // Level 4 - Teal (Great)
  '#6366f1', // Level 5 - Indigo (Mastered)
];

const MASTERY_LABELS = [
  'New',
  'Learning',
  'Familiar',
  'Good',
  'Great',
  'Mastered',
];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}

function StatCard({ title, value, subtitle, icon, color = 'text-indigo-600 dark:text-indigo-400' }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

function StreakIndicator({ currentStreak, longestStreak, lastStudyDate }: StreakIndicatorProps) {
  const isActiveToday = useMemo(() => {
    if (!lastStudyDate) return false;
    const today = new Date().toDateString();
    const lastStudy = new Date(lastStudyDate).toDateString();
    return today === lastStudy;
  }, [lastStudyDate]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {currentStreak}
          </span>
          <span className="text-muted-foreground">days</span>
        </div>

        {/* Visual streak indicator */}
        <div className="flex gap-1 mt-3">
          {Array.from({ length: 7 }).map((_, index) => {
            const dayOffset = 6 - index;
            const isActive = dayOffset < currentStreak;
            return (
              <div
                key={index}
                className={`h-8 flex-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-orange-500 dark:bg-orange-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${index === 6 && isActiveToday ? 'ring-2 ring-orange-400' : ''}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>6 days ago</span>
          <span>Today</span>
        </div>

        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Longest streak</span>
            <span className="font-semibold">{longestStreak} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DailyGoalProgressProps {
  dailyGoal: number;
  todayCompleted: number;
}

function DailyGoalProgress({ dailyGoal, todayCompleted }: DailyGoalProgressProps) {
  const percentage = Math.min((todayCompleted / dailyGoal) * 100, 100);
  const isCompleted = todayCompleted >= dailyGoal;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-indigo-500'}`} />
          Daily Goal
        </CardTitle>
        <CardDescription>
          {isCompleted ? 'Goal completed!' : `${dailyGoal - todayCompleted} more to go`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-4xl font-bold ${isCompleted ? 'text-green-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {todayCompleted}
          </span>
          <span className="text-muted-foreground">/ {dailyGoal}</span>
        </div>

        <Progress value={percentage} className="h-3" />

        <p className="text-sm text-muted-foreground mt-2">
          {percentage.toFixed(0)}% of daily goal
        </p>
      </CardContent>
    </Card>
  );
}

interface MasteryDistributionChartProps {
  data: VocabularyStatisticsType['masteryDistribution'];
}

function MasteryDistributionChart({ data }: MasteryDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-500" />
          Mastery Distribution
        </CardTitle>
        <CardDescription>
          Items by mastery level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis
                dataKey="label"
                type="category"
                width={70}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MASTERY_COLORS[entry.level] || MASTERY_COLORS[0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {MASTERY_LABELS.map((label, index) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: MASTERY_COLORS[index] }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressOverTimeChartProps {
  data: VocabularyStatisticsType['progressOverTime'];
}

function ProgressOverTimeChart({ data }: ProgressOverTimeChartProps) {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Learning Progress
        </CardTitle>
        <CardDescription>
          Items mastered over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="itemsMastered"
                name="Mastered"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#22c55e' }}
              />
              <Line
                type="monotone"
                dataKey="totalItems"
                name="Total Studied"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardContent className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          Failed to load statistics
        </h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </CardContent>
    </Card>
  );
}

export function VocabularyStatistics() {
  const { isLoading, error, statistics, refetch } = useVocabularyStatistics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-muted-foreground">Loading statistics...</span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Statistics Yet</h3>
          <p className="text-muted-foreground">
            Start learning vocabulary to see your progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = statistics.totalItems > 0
    ? ((statistics.masteredItems / statistics.totalItems) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={statistics.totalItems}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Studied"
          value={statistics.studiedItems}
          subtitle={`${statistics.totalItems > 0 ? ((statistics.studiedItems / statistics.totalItems) * 100).toFixed(0) : 0}% coverage`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Mastered"
          value={statistics.masteredItems}
          subtitle={`${overallProgress}% of total`}
          icon={<Target className="h-5 w-5" />}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Due for Review"
          value={statistics.dueForReview}
          subtitle={statistics.dueForReview > 0 ? 'Ready to review' : 'All caught up!'}
          icon={<Clock className="h-5 w-5" />}
          color={statistics.dueForReview > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}
        />
      </div>

      {/* Streak and Daily Goal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StreakIndicator
          currentStreak={statistics.currentStreak}
          longestStreak={statistics.longestStreak}
          lastStudyDate={statistics.lastStudyDate}
        />
        <DailyGoalProgress
          dailyGoal={statistics.dailyGoal}
          todayCompleted={statistics.todayCompleted}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MasteryDistributionChart data={statistics.masteryDistribution} />
        <ProgressOverTimeChart data={statistics.progressOverTime} />
      </div>
    </div>
  );
}
