import { NextRequest, NextResponse } from 'next/server'
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository'
import { SupabaseQuizAttemptRepository } from '@/infrastructure/supabase/quiz-attempt-repository'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import { SubmitQuizAnswerUseCase } from '@/domain/use-cases/submit-quiz-answer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordId, quizType, question, userAnswer, correctAnswer, timeTakenMs } = body

    // 입력 유효성 검사
    if (!recordId || typeof recordId !== 'string') {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 })
    }

    if (!quizType || !['korean_to_english', 'fill_blank', 'multiple_choice'].includes(quizType)) {
      return NextResponse.json({ error: 'Valid quizType is required' }, { status: 400 })
    }

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    if (!userAnswer || typeof userAnswer !== 'string') {
      return NextResponse.json({ error: 'userAnswer is required' }, { status: 400 })
    }

    if (!correctAnswer || typeof correctAnswer !== 'string') {
      return NextResponse.json({ error: 'correctAnswer is required' }, { status: 400 })
    }

    if (typeof timeTakenMs !== 'number' || timeTakenMs < 0) {
      return NextResponse.json({ error: 'Valid timeTakenMs is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recordRepository = new SupabaseLearningRecordRepository(supabase)
    const quizRepository = new SupabaseQuizAttemptRepository(supabase)
    const useCase = new SubmitQuizAnswerUseCase(quizRepository, recordRepository)

    const result = await useCase.execute({
      userId: user.id,
      recordId,
      quizType,
      question,
      userAnswer,
      correctAnswer,
      timeTakenMs,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Quiz submit error:', error)

    if (error instanceof Error && error.message.startsWith('Learning record not found')) {
      return NextResponse.json({ error: 'Learning record not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
