'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { Flame, BookOpen, Trophy, Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  useLearningRecordsStatistics,
  type LearningRecordsStatistics as LearningRecordsStatisticsType,
} from '@/presentation/hooks/useLearningRecordsStatistics';

const MASTERY_COLORS = [
  '#ef4444', // Level 0 - Red (New)
  '#f97316', // Level 1 - Orange (Learning)
  '#eab308', // Level 2 - Yellow (Familiar)
  '#22c55e', // Level 3 - Green (Good)
  '#14b8a6', // Level 4 - Teal (Great)
  '#6366f1', // Level 5 - Indigo (Mastered)
];

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, color = 'text-indigo-600 dark:text-indigo-400', trend }: StatCardProps) {
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
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.isPositive ? '+' : ''}{trend.value}% vs last week</span>
              </div>
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

interface CategoryBreakdownChartProps {
  data: LearningRecordsStatisticsType['categoryBreakdown'];
}

function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    // Take top 8 categories, group rest as "Other"
    if (data.length <= 8) {
      return data;
    }
    const top8 = data.slice(0, 8);
    const others = data.slice(8);
    const otherCount = others.reduce((sum, item) => sum + item.count, 0);
    return [...top8, { category: 'Other', count: otherCount }];
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-500" />
          Category Breakdown
        </CardTitle>
        <CardDescription>
          Expressions by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                dataKey="count"
                nameKey="category"
                label={({ category, percent }) =>
                  percent > 0.05 ? `${category} (${(percent * 100).toFixed(0)}%)` : ''
                }
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                formatter={(value: number) => [value, 'Expressions']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface MasteryDistributionChartProps {
  data: LearningRecordsStatisticsType['masteryDistribution'];
}

function MasteryDistributionChart({ data }: MasteryDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Mastery Distribution
        </CardTitle>
        <CardDescription>
          Expressions by mastery level
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
          {data.map((item, index) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: MASTERY_COLORS[index] }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StreakIndicatorProps {
  currentStreak: number;
  monthlySummary: LearningRecordsStatisticsType['monthlySummary'];
}

function StreakIndicator({ currentStreak, monthlySummary }: StreakIndicatorProps) {
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
                }`}
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
            <span className="text-sm text-muted-foreground">Days active this month</span>
            <span className="font-semibold">{monthlySummary.daysActive} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklySummaryCardProps {
  weeklySummary: LearningRecordsStatisticsType['weeklySummary'];
  monthlySummary: LearningRecordsStatisticsType['monthlySummary'];
}

function WeeklySummaryCard({ weeklySummary, monthlySummary }: WeeklySummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Weekly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">New this week</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{weeklySummary.thisWeek.recordsCreated}</span>
              {weeklySummary.comparison.recordsCreatedDiff !== 0 && (
                <span className={`text-xs ${
                  weeklySummary.comparison.recordsCreatedDiff > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {weeklySummary.comparison.recordsCreatedDiff > 0 ? '+' : ''}
                  {weeklySummary.comparison.recordsCreatedDiffPercent}%
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Reviewed this week</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{weeklySummary.thisWeek.recordsReviewed}</span>
              {weeklySummary.comparison.recordsReviewedDiff !== 0 && (
                <span className={`text-xs ${
                  weeklySummary.comparison.recordsReviewedDiff > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {weeklySummary.comparison.recordsReviewedDiff > 0 ? '+' : ''}
                  {weeklySummary.comparison.recordsReviewedDiffPercent}%
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">This month total</span>
            <span className="font-semibold text-lg text-indigo-600 dark:text-indigo-400">
              {monthlySummary.recordsCreated}
            </span>
          </div>
          <div className="pt-2 border-t dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average mastery</span>
              <span className="font-semibold text-lg">{weeklySummary.thisWeek.averageMastery.toFixed(1)}</span>
            </div>
          </div>
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

export function LearningRecordsStatistics() {
  const { isLoading, error, statistics, refetch } = useLearningRecordsStatistics();

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

  if (!statistics || statistics.totalRecords === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Statistics Yet</h3>
          <p className="text-muted-foreground">
            Start learning expressions to see your progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate mastered count (level 4 and 5)
  const masteredCount = statistics.masteryDistribution
    .filter((item) => item.level >= 4)
    .reduce((sum, item) => sum + item.count, 0);

  const masteredPercentage = statistics.totalRecords > 0
    ? ((masteredCount / statistics.totalRecords) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Expressions"
          value={statistics.totalRecords}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="This Week"
          value={statistics.weeklySummary.thisWeek.recordsCreated}
          subtitle="New expressions"
          icon={<Calendar className="h-5 w-5" />}
          color="text-blue-600 dark:text-blue-400"
          trend={statistics.weeklySummary.comparison.recordsCreatedDiffPercent !== 0 ? {
            value: statistics.weeklySummary.comparison.recordsCreatedDiffPercent,
            isPositive: statistics.weeklySummary.comparison.recordsCreatedDiff > 0,
          } : undefined}
        />
        <StatCard
          title="Mastered"
          value={masteredCount}
          subtitle={`${masteredPercentage}% of total`}
          icon={<Trophy className="h-5 w-5" />}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Current Streak"
          value={`${statistics.currentStreak} days`}
          subtitle={statistics.currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
          icon={<Flame className="h-5 w-5" />}
          color={statistics.currentStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}
        />
      </div>

      {/* Streak and Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StreakIndicator
          currentStreak={statistics.currentStreak}
          monthlySummary={statistics.monthlySummary}
        />
        <WeeklySummaryCard
          weeklySummary={statistics.weeklySummary}
          monthlySummary={statistics.monthlySummary}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdownChart data={statistics.categoryBreakdown} />
        <MasteryDistributionChart data={statistics.masteryDistribution} />
      </div>
    </div>
  );
}
