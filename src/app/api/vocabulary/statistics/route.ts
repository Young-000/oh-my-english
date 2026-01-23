import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

const SCHEMA = 'oh_my_english';

/**
 * Mastery distribution for chart display
 */
interface MasteryDistributionItem {
  level: number;
  label: string;
  count: number;
}

/**
 * Daily progress for line chart
 */
interface DailyProgress {
  date: string;
  itemsMastered: number;
  totalItems: number;
}

/**
 * Overall vocabulary statistics response type
 */
interface OverallStatistics {
  totalItems: number;
  totalBooks: number;
  overallMasteryPercentage: number;
  dailyStudyCounts: Array<{
    date: string;
    count: number;
  }>;
  masteryDistribution: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
  currentStreak: number;
  itemsDueForReview: number;
}

/**
 * Extended statistics for dashboard component
 */
interface DashboardStatistics {
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
  masteryDistribution: MasteryDistributionItem[];
  progressOverTime: DailyProgress[];
}

const MASTERY_LABELS = ['New', 'Learning', 'Familiar', 'Good', 'Great', 'Mastered'];

/**
 * GET /api/vocabulary/statistics
 * Get overall vocabulary statistics for authenticated user
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
      booksResult,
      progressResult,
      dueForReviewResult,
    ] = await Promise.all([
      // Get user's accessible books
      supabase
        .schema(SCHEMA)
        .from('vocabulary_books')
        .select('id, expression_count')
        .or(`is_system.eq.true,is_public.eq.true,user_id.eq.${userId}`),

      // Get all progress records for the user
      supabase
        .schema(SCHEMA)
        .from('vocabulary_progress')
        .select('*')
        .eq('user_id', userId),

      // Get items due for review
      supabase
        .schema(SCHEMA)
        .from('vocabulary_progress')
        .select('id')
        .eq('user_id', userId)
        .lte('next_review_at', new Date().toISOString()),
    ]);

    if (booksResult.error) {
      console.error('Error fetching books:', booksResult.error);
      throw new Error('Failed to fetch books');
    }

    if (progressResult.error) {
      console.error('Error fetching progress:', progressResult.error);
      throw new Error('Failed to fetch progress');
    }

    if (dueForReviewResult.error) {
      console.error('Error fetching due items:', dueForReviewResult.error);
      throw new Error('Failed to fetch due items');
    }

    const books = booksResult.data || [];
    const progressRecords = progressResult.data || [];
    const dueItems = dueForReviewResult.data || [];

    // Calculate total items across all books
    const totalItems = books.reduce((sum, book) => sum + (book.expression_count || 0), 0);
    const totalBooks = books.length;

    // Calculate mastery distribution
    const masteryDistribution = {
      level0: 0,
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
    };

    progressRecords.forEach((record) => {
      const level = record.mastery_level ?? 0;
      const key = `level${Math.min(5, Math.max(0, level))}` as keyof typeof masteryDistribution;
      masteryDistribution[key]++;
    });

    // Calculate overall mastery percentage
    const totalMastery = progressRecords.reduce(
      (sum, record) => sum + (record.mastery_level ?? 0),
      0
    );
    const maxPossibleMastery = totalItems * 5;
    const overallMasteryPercentage =
      maxPossibleMastery > 0
        ? Math.round((totalMastery / maxPossibleMastery) * 100)
        : 0;

    // Calculate daily study counts for last 7 days
    const dailyStudyCounts = await calculateDailyStudyCounts(supabase, userId, 7);

    // Calculate current streak
    const currentStreak = await calculateStudyStreak(supabase, userId);

    // Calculate studied items (items with any progress)
    const studiedItems = progressRecords.length;

    // Calculate mastered items (level 4 or 5)
    const masteredItems = progressRecords.filter(
      (record) => (record.mastery_level ?? 0) >= 4
    ).length;

    // Calculate average mastery
    const averageMastery =
      studiedItems > 0
        ? progressRecords.reduce((sum, record) => sum + (record.mastery_level ?? 0), 0) /
          studiedItems
        : 0;

    // Get last study date
    const lastStudyDate = progressRecords.length > 0
      ? progressRecords.reduce((latest, record) => {
          const recordDate = record.last_reviewed_at;
          if (!latest || (recordDate && recordDate > latest)) {
            return recordDate;
          }
          return latest;
        }, null as string | null)
      : null;

    // Calculate longest streak
    const longestStreak = await calculateLongestStreak(supabase, userId);

    // Calculate today's completed items
    const todayCompleted = await calculateTodayCompleted(supabase, userId);

    // Default daily goal (could be made configurable per user later)
    const dailyGoal = 10;

    // Convert mastery distribution to chart format
    const masteryDistributionArray: MasteryDistributionItem[] = [
      { level: 0, label: MASTERY_LABELS[0], count: masteryDistribution.level0 },
      { level: 1, label: MASTERY_LABELS[1], count: masteryDistribution.level1 },
      { level: 2, label: MASTERY_LABELS[2], count: masteryDistribution.level2 },
      { level: 3, label: MASTERY_LABELS[3], count: masteryDistribution.level3 },
      { level: 4, label: MASTERY_LABELS[4], count: masteryDistribution.level4 },
      { level: 5, label: MASTERY_LABELS[5], count: masteryDistribution.level5 },
    ];

    // Calculate progress over time for line chart
    const progressOverTime = await calculateProgressOverTime(supabase, userId, 14);

    // Legacy statistics format (for backward compatibility)
    const statistics: OverallStatistics = {
      totalItems,
      totalBooks,
      overallMasteryPercentage,
      dailyStudyCounts,
      masteryDistribution,
      currentStreak,
      itemsDueForReview: dueItems.length,
    };

    // Dashboard statistics format (for new component)
    const dashboardStatistics: DashboardStatistics = {
      totalItems,
      studiedItems,
      masteredItems,
      averageMastery: Math.round(averageMastery * 100) / 100,
      dueForReview: dueItems.length,
      currentStreak,
      longestStreak,
      lastStudyDate,
      dailyGoal,
      todayCompleted,
      masteryDistribution: masteryDistributionArray,
      progressOverTime,
    };

    return NextResponse.json({
      statusCode: 200,
      data: statistics,
      statistics: dashboardStatistics,
    });
  } catch (error) {
    console.error('Error fetching vocabulary statistics:', error);
    return NextResponse.json(
      { statusCode: 500, error: 'Failed to fetch vocabulary statistics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate daily study counts for the last N days
 */
async function calculateDailyStudyCounts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  days: number
): Promise<Array<{ date: string; count: number }>> {
  const result: Array<{ date: string; count: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];

    const { count, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('last_reviewed_at', date.toISOString())
      .lt('last_reviewed_at', nextDate.toISOString());

    if (error) {
      console.error(`Error fetching count for ${dateStr}:`, error);
    }

    result.push({
      date: dateStr,
      count: count ?? 0,
    });
  }

  return result;
}

/**
 * Calculate current study streak (consecutive days)
 */
async function calculateStudyStreak(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let daysBack = 0;

  // Check up to 365 days back
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - daysBack);

    const nextDate = new Date(checkDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const { count, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('last_reviewed_at', checkDate.toISOString())
      .lt('last_reviewed_at', nextDate.toISOString());

    if (error) {
      console.error('Error checking streak:', error);
      break;
    }

    if (count && count > 0) {
      streak++;
      daysBack++;
    } else {
      // If today has no activity, check if yesterday had activity (streak continues)
      if (i === 0) {
        daysBack++;
        continue;
      }
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest study streak ever
 */
async function calculateLongestStreak(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<number> {
  // Get all unique study dates
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_progress')
    .select('last_reviewed_at')
    .eq('user_id', userId)
    .not('last_reviewed_at', 'is', null)
    .order('last_reviewed_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return 0;
  }

  // Get unique dates
  const uniqueDates = new Set<string>();
  data.forEach((record) => {
    if (record.last_reviewed_at) {
      const date = new Date(record.last_reviewed_at).toISOString().split('T')[0];
      uniqueDates.add(date);
    }
  });

  const sortedDates = Array.from(uniqueDates).sort();

  if (sortedDates.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    const diffDays = Math.round(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Calculate items completed today
 */
async function calculateTodayCompleted(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count, error } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('last_reviewed_at', today.toISOString())
    .lt('last_reviewed_at', tomorrow.toISOString());

  if (error) {
    console.error('Error calculating today completed:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Calculate progress over time (mastered and total studied items per day)
 */
async function calculateProgressOverTime(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  days: number
): Promise<DailyProgress[]> {
  const result: DailyProgress[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We'll calculate cumulative progress up to each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];

    // Get progress records up to this date
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('mastery_level')
      .eq('user_id', userId)
      .lt('created_at', nextDate.toISOString());

    if (error) {
      console.error(`Error fetching progress for ${dateStr}:`, error);
      result.push({ date: dateStr, itemsMastered: 0, totalItems: 0 });
      continue;
    }

    const totalItems = data?.length ?? 0;
    const itemsMastered = data?.filter((r) => (r.mastery_level ?? 0) >= 4).length ?? 0;

    result.push({
      date: dateStr,
      itemsMastered,
      totalItems,
    });
  }

  return result;
}
