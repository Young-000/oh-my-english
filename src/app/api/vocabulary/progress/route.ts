import { NextRequest, NextResponse } from 'next/server'
import { vocabularyRepository } from '@/infrastructure/supabase/vocabulary-repository'
import { createClient } from '@/infrastructure/supabase/client'

/**
 * POST /api/vocabulary/progress
 * 학습 결과 기록
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, isCorrect } = body

    if (!itemId || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'itemId and isCorrect are required' },
        { status: 400 }
      )
    }

    const progress = await vocabularyRepository.recordStudyResult(
      user.id,
      itemId,
      isCorrect
    )

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to record progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Error recording progress:', error)
    return NextResponse.json(
      { error: 'Failed to record progress' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vocabulary/progress/due
 * 복습이 필요한 항목 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const items = await vocabularyRepository.getDueForReview(user.id, limit)

    return NextResponse.json({ items, count: items.length })
  } catch (error) {
    console.error('Error fetching due items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch due items' },
      { status: 500 }
    )
  }
}
