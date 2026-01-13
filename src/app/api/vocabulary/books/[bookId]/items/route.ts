import { NextRequest, NextResponse } from 'next/server'
import { vocabularyRepository } from '@/infrastructure/supabase/vocabulary-repository'
import { createClient } from '@/infrastructure/supabase/client'

interface RouteParams {
  params: Promise<{ bookId: string }>
}

/**
 * POST /api/vocabulary/books/:bookId/items
 * 단어장에 새 표현 추가
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookId } = await params

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 소유권 확인: 단어장 조회
    const book = await vocabularyRepository.getBookWithItems(bookId)
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 시스템 단어장에는 추가 불가
    if (book.is_system) {
      return NextResponse.json({ error: 'Cannot add items to system books' }, { status: 403 })
    }

    // 본인 소유 단어장에만 추가 가능
    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to add items to this book' }, { status: 403 })
    }

    const body = await request.json()
    const {
      koreanExpression,
      englishExpression,
      pronunciationGuide,
      contextExplanation,
      usageExamples,
      alternatives,
      difficultyLevel,
      tags,
    } = body

    if (!koreanExpression || !englishExpression) {
      return NextResponse.json(
        { error: 'Korean and English expressions are required' },
        { status: 400 }
      )
    }

    const item = await vocabularyRepository.createItem({
      book_id: bookId,
      korean_expression: koreanExpression,
      english_expression: englishExpression,
      pronunciation_guide: pronunciationGuide || null,
      context_explanation: contextExplanation || null,
      usage_examples: usageExamples || [],
      alternatives: alternatives || [],
      difficulty_level: difficultyLevel || 1,
      tags: tags || [],
    })

    if (!item) {
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error adding vocabulary item:', error)
    return NextResponse.json(
      { error: 'Failed to add vocabulary item' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/vocabulary/books/:bookId/items
 * 여러 표현 일괄 추가 (학습 기록에서 단어장으로 추가할 때)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookId } = await params

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 소유권 확인: 단어장 조회
    const book = await vocabularyRepository.getBookWithItems(bookId)
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 시스템 단어장에는 추가 불가
    if (book.is_system) {
      return NextResponse.json({ error: 'Cannot add items to system books' }, { status: 403 })
    }

    // 본인 소유 단어장에만 추가 가능
    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to add items to this book' }, { status: 403 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    const itemsToCreate = items.map((item, index) => ({
      book_id: bookId,
      korean_expression: item.koreanExpression,
      english_expression: item.englishExpression,
      pronunciation_guide: item.pronunciationGuide || null,
      context_explanation: item.contextExplanation || null,
      usage_examples: item.usageExamples || [],
      alternatives: item.alternatives || [],
      difficulty_level: item.difficultyLevel || 1,
      tags: item.tags || [],
      order_index: index,
    }))

    const createdItems = await vocabularyRepository.createItems(itemsToCreate)

    return NextResponse.json({ items: createdItems, count: createdItems.length })
  } catch (error) {
    console.error('Error adding vocabulary items:', error)
    return NextResponse.json(
      { error: 'Failed to add vocabulary items' },
      { status: 500 }
    )
  }
}
