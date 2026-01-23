import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

const SCHEMA = 'oh_my_english';

/**
 * Route params interface
 */
interface RouteParams {
  params: Promise<{ bookId: string }>;
}

/**
 * Book-specific statistics response type
 */
interface BookStatistics {
  bookId: string;
  bookTitle: string;
  totalItems: number;
  studiedItems: number;
  masteredItems: number;
  progressOverTime: Array<{
    date: string;
    studiedCount: number;
    masteredCount: number;
  }>;
  masteryDistribution: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
  accuracyRate: number;
  timeSinceLastStudy: string | null;
  averageMastery: number;
}

/**
 * GET /api/vocabulary/statistics/:bookId
 * Get statistics for a specific vocabulary book
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { bookId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { statusCode: 401, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get book details
    const { data: book, error: bookError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { statusCode: 404, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this book
    const hasAccess =
      book.is_system ||
      book.is_public ||
      book.user_id === userId;

    if (!hasAccess) {
      return NextResponse.json(
        { statusCode: 403, error: 'Access denied to this book' },
        { status: 403 }
      );
    }

    // Get all items in the book
    const { data: items, error: itemsError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .select('id')
      .eq('book_id', bookId);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw new Error('Failed to fetch items');
    }

    const itemIds = items?.map((item) => item.id) || [];
    const totalItems = itemIds.length;

    // Get progress records for these items
    let progressRecords: Array<{
      id: string;
      user_id: string;
      item_id: string;
      mastery_level: number;
      review_count: number;
      correct_count: number;
      last_reviewed_at: string | null;
      next_review_at: string | null;
      created_at: string;
      updated_at: string;
    }> = [];

    if (itemIds.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .schema(SCHEMA)
        .from('vocabulary_progress')
        .select('*')
        .eq('user_id', userId)
        .in('item_id', itemIds);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
        throw new Error('Failed to fetch progress');
      }

      progressRecords = progress || [];
    }

    // Calculate statistics
    const studiedItems = progressRecords.length;
    const masteredItems = progressRecords.filter(
      (p) => p.mastery_level >= 4
    ).length;

    // Calculate mastery distribution
    const masteryDistribution = {
      level0: totalItems - studiedItems, // Items not yet studied
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
    };

    progressRecords.forEach((record) => {
      const level = record.mastery_level ?? 0;
      if (level >= 1 && level <= 5) {
        const key = `level${level}` as keyof typeof masteryDistribution;
        masteryDistribution[key]++;
        masteryDistribution.level0--; // Reduce unstarted count
      }
    });

    // Ensure level0 doesn't go negative
    masteryDistribution.level0 = Math.max(0, masteryDistribution.level0);

    // Calculate accuracy rate
    const totalReviews = progressRecords.reduce(
      (sum, p) => sum + (p.review_count ?? 0),
      0
    );
    const totalCorrect = progressRecords.reduce(
      (sum, p) => sum + (p.correct_count ?? 0),
      0
    );
    const accuracyRate =
      totalReviews > 0
        ? Math.round((totalCorrect / totalReviews) * 100)
        : 0;

    // Calculate average mastery
    const totalMastery = progressRecords.reduce(
      (sum, p) => sum + (p.mastery_level ?? 0),
      0
    );
    const averageMastery =
      totalItems > 0
        ? Math.round((totalMastery / totalItems) * 100) / 100
        : 0;

    // Calculate time since last study
    const lastStudiedRecords = progressRecords
      .filter((p) => p.last_reviewed_at)
      .sort(
        (a, b) =>
          new Date(b.last_reviewed_at!).getTime() -
          new Date(a.last_reviewed_at!).getTime()
      );

    let timeSinceLastStudy: string | null = null;
    if (lastStudiedRecords.length > 0) {
      const lastStudyDate = new Date(lastStudiedRecords[0].last_reviewed_at!);
      timeSinceLastStudy = formatTimeSince(lastStudyDate);
    }

    // Calculate progress over time (last 30 days)
    const progressOverTime = await calculateProgressOverTime(
      supabase,
      userId,
      itemIds,
      30
    );

    const statistics: BookStatistics = {
      bookId,
      bookTitle: book.title,
      totalItems,
      studiedItems,
      masteredItems,
      progressOverTime,
      masteryDistribution,
      accuracyRate,
      timeSinceLastStudy,
      averageMastery,
    };

    return NextResponse.json({
      statusCode: 200,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching book statistics:', error);
    return NextResponse.json(
      { statusCode: 500, error: 'Failed to fetch book statistics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate progress over time for the last N days
 */
async function calculateProgressOverTime(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  itemIds: string[],
  days: number
): Promise<Array<{ date: string; studiedCount: number; masteredCount: number }>> {
  const result: Array<{ date: string; studiedCount: number; masteredCount: number }> = [];

  if (itemIds.length === 0) {
    // Return empty results for all days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({
        date: date.toISOString().split('T')[0],
        studiedCount: 0,
        masteredCount: 0,
      });
    }
    return result;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];

    // Get progress records up to this date
    const { data: progressData, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('mastery_level')
      .eq('user_id', userId)
      .in('item_id', itemIds)
      .lte('created_at', nextDate.toISOString());

    if (error) {
      console.error(`Error fetching progress for ${dateStr}:`, error);
      result.push({ date: dateStr, studiedCount: 0, masteredCount: 0 });
      continue;
    }

    const studiedCount = progressData?.length ?? 0;
    const masteredCount =
      progressData?.filter((p) => p.mastery_level >= 4).length ?? 0;

    result.push({
      date: dateStr,
      studiedCount,
      masteredCount,
    });
  }

  return result;
}

/**
 * Format time since a given date as a human-readable string
 */
function formatTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }
  if (diffWeeks > 0) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  }
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}
