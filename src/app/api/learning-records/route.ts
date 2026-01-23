import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/client';
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository';
import type { LearningRecordFilters } from '@/domain/repositories/learning-record-repository';

/**
 * GET /api/learning-records
 * 사용자의 학습 기록 목록 조회
 *
 * Query params:
 *   - page: 페이지 번호 (default: 1)
 *   - limit: 페이지당 항목 수 (default: 10, max: 100)
 *   - category: 카테고리 필터
 *   - startDate: 시작 날짜 (ISO 8601 형식)
 *   - endDate: 종료 날짜 (ISO 8601 형식)
 *   - bookmarked: 북마크 필터 ('true' | 'false')
 *   - search: 검색어 (한국어/영어 표현 검색)
 *   - masteryLevel: 숙련도 레벨 필터 (0-5)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // Parse filter params
    const category = searchParams.get('category') || undefined;
    const bookmarkedParam = searchParams.get('bookmarked');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const searchQuery = searchParams.get('search') || undefined;
    const masteryLevelParam = searchParams.get('masteryLevel');

    // Build filters
    const filters: LearningRecordFilters = {
      userId: user.id,
      limit,
      offset,
    };

    if (category) {
      filters.category = category;
    }

    if (bookmarkedParam !== null) {
      filters.isBookmarked = bookmarkedParam === 'true';
    }

    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (!isNaN(startDate.getTime())) {
        filters.startDate = startDate;
      }
    }

    if (endDateParam) {
      const endDate = new Date(endDateParam);
      if (!isNaN(endDate.getTime())) {
        filters.endDate = endDate;
      }
    }

    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }

    if (masteryLevelParam !== null) {
      const masteryLevel = parseInt(masteryLevelParam, 10);
      if (!isNaN(masteryLevel) && masteryLevel >= 0 && masteryLevel <= 5) {
        filters.masteryLevel = masteryLevel;
      }
    }

    // Fetch records with count
    const repository = new SupabaseLearningRecordRepository(supabase);
    const { records, total } = await repository.findByUserIdWithCount(filters);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching learning records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning records' },
      { status: 500 }
    );
  }
}
