import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

const SCHEMA = 'oh_my_english';

/**
 * Category breakdown item
 */
interface CategoryBreakdown {
  category: string;
  count: number;
}

/**
 * Mastery distribution item
 */
interface MasteryDistributionItem {
  level: number;
  label: string;
  count: number;
}

/**
 * Daily activity data for heatmap
 */
interface DailyActivity {
  date: string;
  count: number;
}

/**
 * Weekly summary comparison
 */
interface WeeklySummary {
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

/**
 * Monthly summary
 */
interface MonthlySummary {
  recordsCreated: number;
  recordsReviewed: number;
  averageMastery: number;
  daysActive: number;
}

/**
 * Complete statistics response
 */
interface LearningRecordsStatistics {
  totalRecords: number;
  bookmarkedRecords: number;
  masteredRecords: number;
  dueForReview: number;
  averageMastery: number;
  categoryBreakdown: CategoryBreakdown[];
  masteryDistribution: MasteryDistributionItem[];
  dailyActivity: DailyActivity[];
  weeklySummary: WeeklySummary;
  monthlySummary: MonthlySummary;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

const MASTERY_LABELS = ['New', 'Learning', 'Familiar', 'Good', 'Great', 'Mastered'];

/**
 * GET /api/learning-records/statistics
 * Get learning records statistics for authenticated user
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { statusCode: 401, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Execute queries in parallel for better performance
    const [
      totalRecordsResult,
      bookmarkedResult,
      masteredResult,
      dueForReviewResult,
      categoryResult,
      masteryResult,
      allRecordsForDateResult,
    ] = await Promise.all([
      // Get total records count
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Get bookmarked records count
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_bookmarked', true),

      // Get mastered records count (level >= 4)
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('mastery_level', 4),

      // Get items due for review
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or(`next_review_at.lte.${new Date().toISOString()},mastery_level.lt.3`),

      // Get all records for category breakdown
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('category')
        .eq('user_id', userId),

      // Get all records for mastery distribution
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('mastery_level')
        .eq('user_id', userId),

      // Get all records with created_at for last study date
      supabase
        .schema(SCHEMA)
        .from('learning_records')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    if (totalRecordsResult.error) {
      console.error('Error fetching total records:', totalRecordsResult.error);
      throw new Error('Failed to fetch total records');
    }

    if (bookmarkedResult.error) {
      console.error('Error fetching bookmarked records:', bookmarkedResult.error);
      throw new Error('Failed to fetch bookmarked records');
    }

    if (masteredResult.error) {
      console.error('Error fetching mastered records:', masteredResult.error);
      throw new Error('Failed to fetch mastered records');
    }

    if (dueForReviewResult.error) {
      console.error('Error fetching due for review records:', dueForReviewResult.error);
      throw new Error('Failed to fetch due for review records');
    }

    if (categoryResult.error) {
      console.error('Error fetching category data:', categoryResult.error);
      throw new Error('Failed to fetch category data');
    }

    if (masteryResult.error) {
      console.error('Error fetching mastery data:', masteryResult.error);
      throw new Error('Failed to fetch mastery data');
    }

    const totalRecords = totalRecordsResult.count ?? 0;
    const bookmarkedRecords = bookmarkedResult.count ?? 0;
    const masteredRecords = masteredResult.count ?? 0;
    const dueForReview = dueForReviewResult.count ?? 0;
    const categoryData = categoryResult.data ?? [];
    const masteryData = masteryResult.data ?? [];
    const lastStudyDate = allRecordsForDateResult.data?.[0]?.created_at ?? null;

    // Calculate average mastery
    const totalMastery = masteryData.reduce(
      (sum, record) => sum + (record.mastery_level ?? 0),
      0
    );
    const averageMastery = masteryData.length > 0
      ? Math.round((totalMastery / masteryData.length) * 100) / 100
      : 0;

    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    categoryData.forEach((record) => {
      const category = record.category || 'general';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate mastery distribution
    const masteryDistributionMap: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    masteryData.forEach((record) => {
      const level = record.mastery_level ?? 0;
      const normalizedLevel = Math.min(5, Math.max(0, level));
      masteryDistributionMap[normalizedLevel]++;
    });

    const masteryDistribution: MasteryDistributionItem[] = Object.entries(masteryDistributionMap)
      .map(([level, count]) => ({
        level: parseInt(level, 10),
        label: MASTERY_LABELS[parseInt(level, 10)],
        count,
      }));

    // Calculate daily activity for heatmap (last 365 days)
    const dailyActivity = await calculateDailyActivity(supabase, userId, 365);

    // Calculate weekly summary
    const weeklySummary = await calculateWeeklySummary(supabase, userId);

    // Calculate monthly summary
    const monthlySummary = await calculateMonthlySummary(supabase, userId);

    // Calculate current streak and longest streak
    const { currentStreak, longestStreak } = await calculateStudyStreaks(supabase, userId);

    const statistics: LearningRecordsStatistics = {
      totalRecords,
      bookmarkedRecords,
      masteredRecords,
      dueForReview,
      averageMastery,
      categoryBreakdown,
      masteryDistribution,
      dailyActivity,
      weeklySummary,
      monthlySummary,
      currentStreak,
      longestStreak,
      lastStudyDate,
    };

    return NextResponse.json({
      statusCode: 200,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching learning records statistics:', error);
    return NextResponse.json(
      { statusCode: 500, error: 'Failed to fetch learning records statistics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate daily activity for the last N days (for heatmap)
 */
async function calculateDailyActivity(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  days: number
): Promise<DailyActivity[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  // Get all records created in the date range
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('learning_records')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error fetching daily activity:', error);
    return [];
  }

  // Count records per day
  const dateCountMap = new Map<string, number>();

  // Initialize all dates with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dateCountMap.set(dateStr, 0);
  }

  // Count actual records
  (data ?? []).forEach((record) => {
    const dateStr = new Date(record.created_at).toISOString().split('T')[0];
    if (dateCountMap.has(dateStr)) {
      dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
    }
  });

  // Convert to array
  return Array.from(dateCountMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate weekly summary with comparison
 */
async function calculateWeeklySummary(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<WeeklySummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate this week's start (Monday)
  const thisWeekStart = new Date(today);
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  thisWeekStart.setDate(today.getDate() - daysToMonday);

  const thisWeekEnd = new Date(today);
  thisWeekEnd.setHours(23, 59, 59, 999);

  // Calculate last week's range
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);

  // Fetch this week's data
  const [thisWeekResult, lastWeekResult] = await Promise.all([
    supabase
      .schema(SCHEMA)
      .from('learning_records')
      .select('created_at, updated_at, mastery_level')
      .eq('user_id', userId)
      .gte('created_at', thisWeekStart.toISOString())
      .lte('created_at', thisWeekEnd.toISOString()),

    supabase
      .schema(SCHEMA)
      .from('learning_records')
      .select('created_at, updated_at, mastery_level')
      .eq('user_id', userId)
      .gte('created_at', lastWeekStart.toISOString())
      .lte('created_at', lastWeekEnd.toISOString()),
  ]);

  const thisWeekData = thisWeekResult.data ?? [];
  const lastWeekData = lastWeekResult.data ?? [];

  // Calculate this week stats
  const thisWeekCreated = thisWeekData.length;
  const thisWeekReviewed = thisWeekData.filter(
    (r) => r.updated_at && r.updated_at !== r.created_at
  ).length;
  const thisWeekAvgMastery = thisWeekData.length > 0
    ? thisWeekData.reduce((sum, r) => sum + (r.mastery_level ?? 0), 0) / thisWeekData.length
    : 0;

  // Calculate last week stats
  const lastWeekCreated = lastWeekData.length;
  const lastWeekReviewed = lastWeekData.filter(
    (r) => r.updated_at && r.updated_at !== r.created_at
  ).length;
  const lastWeekAvgMastery = lastWeekData.length > 0
    ? lastWeekData.reduce((sum, r) => sum + (r.mastery_level ?? 0), 0) / lastWeekData.length
    : 0;

  // Calculate comparison
  const recordsCreatedDiff = thisWeekCreated - lastWeekCreated;
  const recordsCreatedDiffPercent = lastWeekCreated > 0
    ? Math.round((recordsCreatedDiff / lastWeekCreated) * 100)
    : thisWeekCreated > 0 ? 100 : 0;

  const recordsReviewedDiff = thisWeekReviewed - lastWeekReviewed;
  const recordsReviewedDiffPercent = lastWeekReviewed > 0
    ? Math.round((recordsReviewedDiff / lastWeekReviewed) * 100)
    : thisWeekReviewed > 0 ? 100 : 0;

  return {
    thisWeek: {
      recordsCreated: thisWeekCreated,
      recordsReviewed: thisWeekReviewed,
      averageMastery: Math.round(thisWeekAvgMastery * 100) / 100,
    },
    lastWeek: {
      recordsCreated: lastWeekCreated,
      recordsReviewed: lastWeekReviewed,
      averageMastery: Math.round(lastWeekAvgMastery * 100) / 100,
    },
    comparison: {
      recordsCreatedDiff,
      recordsCreatedDiffPercent,
      recordsReviewedDiff,
      recordsReviewedDiffPercent,
    },
  };
}

/**
 * Calculate monthly summary
 */
async function calculateMonthlySummary(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<MonthlySummary> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // First day of current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('learning_records')
    .select('created_at, updated_at, mastery_level')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', today.toISOString());

  if (error) {
    console.error('Error fetching monthly data:', error);
    return {
      recordsCreated: 0,
      recordsReviewed: 0,
      averageMastery: 0,
      daysActive: 0,
    };
  }

  const records = data ?? [];

  // Count unique active days
  const uniqueDays = new Set<string>();
  records.forEach((record) => {
    const dateStr = new Date(record.created_at).toISOString().split('T')[0];
    uniqueDays.add(dateStr);
  });

  const recordsCreated = records.length;
  const recordsReviewed = records.filter(
    (r) => r.updated_at && r.updated_at !== r.created_at
  ).length;
  const averageMastery = records.length > 0
    ? records.reduce((sum, r) => sum + (r.mastery_level ?? 0), 0) / records.length
    : 0;

  return {
    recordsCreated,
    recordsReviewed,
    averageMastery: Math.round(averageMastery * 100) / 100,
    daysActive: uniqueDays.size,
  };
}

/**
 * Calculate current and longest study streaks (consecutive days)
 */
async function calculateStudyStreaks(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  // Get all unique study dates
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('learning_records')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates
  const uniqueDates = new Set<string>();
  data.forEach((record) => {
    const date = new Date(record.created_at).toISOString().split('T')[0];
    uniqueDates.add(date);
  });

  const sortedDatesDesc = Array.from(uniqueDates).sort().reverse();
  const sortedDatesAsc = Array.from(uniqueDates).sort();

  if (sortedDatesDesc.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Calculate current streak
  let currentStreak = 0;
  const mostRecentDate = sortedDatesDesc[0];

  // Check if the most recent activity is today or yesterday
  if (mostRecentDate === todayStr || mostRecentDate === yesterdayStr) {
    const expectedDate = new Date(mostRecentDate);

    for (const dateStr of sortedDatesDesc) {
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (dateStr === expectedDateStr) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        const currentDate = new Date(dateStr);
        const diffDays = Math.round(
          (expectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 1) {
          break;
        }
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDatesAsc.length; i++) {
    const prevDate = new Date(sortedDatesAsc[i - 1]);
    const currentDate = new Date(sortedDatesAsc[i]);
    const diffDays = Math.round(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
