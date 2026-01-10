import { NextRequest, NextResponse } from 'next/server'
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import { QuizGenerator } from '@/domain/services/quiz-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordIds } = body

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: 'recordIds array is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repository = new SupabaseLearningRecordRepository(supabase)
    const generator = new QuizGenerator()

    // 모든 레코드 가져오기
    const allRecords = await repository.findByUserId({ userId: user.id, limit: 100 })

    // 요청된 레코드들로 퀴즈 생성
    const quizzes = await Promise.all(
      recordIds.map(async (recordId: string) => {
        const record = await repository.findById(recordId)
        if (!record) {
          return null
        }
        return generator.generateRandomQuiz(record, allRecords)
      })
    )

    const validQuizzes = quizzes.filter((q) => q !== null)

    return NextResponse.json({ quizzes: validQuizzes })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
