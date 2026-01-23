import { NextResponse } from 'next/server';
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository';
import { vocabularyRepository } from '@/infrastructure/supabase/vocabulary-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

export interface DueReviewsResponse {
  dueCount: number;
  nextReviewAt: string | null;
  breakdown: {
    learningRecords: number;
    vocabularyItems: number;
  };
}

/**
 * GET /api/notifications/due-reviews
 * Returns count of items due for review from both learning_records and vocabulary_progress
 */
export async function GET(): Promise<NextResponse<DueReviewsResponse | { error: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch due items from learning_records
    const learningRecordRepository = new SupabaseLearningRecordRepository(supabase);
    const dueRecords = await learningRecordRepository.findDueForReview(user.id, 100);

    // Fetch due items from vocabulary_progress
    const dueVocabularyItems = await vocabularyRepository.getDueForReview(user.id, 100);

    // Calculate total due count
    const learningRecordsCount = dueRecords.length;
    const vocabularyItemsCount = dueVocabularyItems.length;
    const totalDueCount = learningRecordsCount + vocabularyItemsCount;

    // Find the next review time
    let nextReviewAt: string | null = null;

    const allReviewDates: Date[] = [];

    // Add learning records next review dates
    for (const record of dueRecords) {
      if (record.nextReviewAt) {
        allReviewDates.push(record.nextReviewAt);
      }
    }

    // Add vocabulary items next review dates
    for (const item of dueVocabularyItems) {
      if (item.progress?.next_review_at) {
        allReviewDates.push(new Date(item.progress.next_review_at));
      }
    }

    // Sort and get the earliest review date
    if (allReviewDates.length > 0) {
      allReviewDates.sort((a, b) => a.getTime() - b.getTime());
      nextReviewAt = allReviewDates[0].toISOString();
    }

    return NextResponse.json({
      dueCount: totalDueCount,
      nextReviewAt,
      breakdown: {
        learningRecords: learningRecordsCount,
        vocabularyItems: vocabularyItemsCount,
      },
    });
  } catch (error) {
    console.error('Due reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
