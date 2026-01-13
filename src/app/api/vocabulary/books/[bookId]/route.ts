import { NextRequest, NextResponse } from 'next/server'
import { vocabularyRepository } from '@/infrastructure/supabase/vocabulary-repository'
import { createClient } from '@/infrastructure/supabase/client'

interface RouteParams {
  params: Promise<{ bookId: string }>
}

/**
 * GET /api/vocabulary/books/:bookId
 * 단어장 상세 조회 (항목 포함)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookId } = await params

    // 사용자 인증 확인
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    const book = await vocabularyRepository.getBookWithItems(bookId)

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 진행도 포함 조회 (로그인한 경우)
    let itemsWithProgress = book.items || []
    let stats = null

    if (userId && book.items && book.items.length > 0) {
      itemsWithProgress = await vocabularyRepository.getItemsWithProgress(bookId, userId)
      stats = await vocabularyRepository.getBookStats(bookId, userId)
    }

    return NextResponse.json({
      book: {
        ...book,
        items: itemsWithProgress,
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching vocabulary book:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary book' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/vocabulary/books/:bookId
 * 단어장 수정
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookId } = await params

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 소유권 확인: 기존 단어장 조회
    const existingBook = await vocabularyRepository.getBookWithItems(bookId)
    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 시스템 단어장은 수정 불가
    if (existingBook.is_system) {
      return NextResponse.json({ error: 'Cannot modify system books' }, { status: 403 })
    }

    // 본인 소유 단어장만 수정 가능
    if (existingBook.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to modify this book' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, category, isPublic, coverEmoji } = body

    const book = await vocabularyRepository.updateBook(bookId, {
      title,
      description,
      category,
      is_public: isPublic,
      cover_emoji: coverEmoji,
    })

    if (!book) {
      return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
    }

    return NextResponse.json({ book })
  } catch (error) {
    console.error('Error updating vocabulary book:', error)
    return NextResponse.json(
      { error: 'Failed to update vocabulary book' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vocabulary/books/:bookId
 * 단어장 삭제
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { bookId } = await params

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 소유권 확인: 기존 단어장 조회
    const existingBook = await vocabularyRepository.getBookWithItems(bookId)
    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // 시스템 단어장은 삭제 불가
    if (existingBook.is_system) {
      return NextResponse.json({ error: 'Cannot delete system books' }, { status: 403 })
    }

    // 본인 소유 단어장만 삭제 가능
    if (existingBook.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this book' }, { status: 403 })
    }

    const success = await vocabularyRepository.deleteBook(bookId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vocabulary book:', error)
    return NextResponse.json(
      { error: 'Failed to delete vocabulary book' },
      { status: 500 }
    )
  }
}
