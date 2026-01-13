import { NextRequest, NextResponse } from 'next/server'
import { vocabularyRepository } from '@/infrastructure/supabase/vocabulary-repository'
import { createClient } from '@/infrastructure/supabase/client'

/**
 * GET /api/vocabulary/books
 * 단어장 목록 조회
 * Query params:
 *   - type: 'system' | 'public' | 'user' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'

    // 사용자 인증 확인
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    let books

    switch (type) {
      case 'system':
        books = await vocabularyRepository.getSystemBooks()
        break
      case 'public':
        books = await vocabularyRepository.getPublicBooks()
        break
      case 'user':
        if (!userId) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }
        books = await vocabularyRepository.getUserBooks(userId)
        break
      case 'all':
      default:
        books = await vocabularyRepository.getAccessibleBooks(userId)
        break
    }

    return NextResponse.json({ books })
  } catch (error) {
    console.error('Error fetching vocabulary books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary books' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vocabulary/books
 * 새 단어장 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, isPublic, coverEmoji } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const book = await vocabularyRepository.createBook({
      user_id: user.id,
      title,
      description: description || null,
      category: category || 'general',
      is_public: isPublic || false,
      cover_emoji: coverEmoji || '📚',
    })

    if (!book) {
      return NextResponse.json({ error: 'Failed to create vocabulary book' }, { status: 500 })
    }

    return NextResponse.json({ book }, { status: 201 })
  } catch (error) {
    console.error('Error creating vocabulary book:', error)
    return NextResponse.json(
      { error: 'Failed to create vocabulary book' },
      { status: 500 }
    )
  }
}
