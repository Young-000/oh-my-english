import { NextRequest, NextResponse } from 'next/server'
import { ClaudeTranslationService } from '@/infrastructure/ai/claude-service'
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository'
import { TranslateAndSaveUseCase } from '@/domain/use-cases/translate-and-save'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import { generateMockTranslation } from '@/lib/mock/translation-mock'
import type { TargetType, SituationType } from '@/presentation/components/TranslationInput'
import type { LearningRecord } from '@/domain/entities/translation'

// API 키가 유효한지 확인
function isValidApiKey(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY
  // placeholder이거나 sk-로 시작하지 않으면 Mock 모드
  if (!apiKey || apiKey === 'placeholder_api_key' || !apiKey.startsWith('sk-')) {
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { koreanInput, target = 'adult', situation = 'casual' } = body as {
      koreanInput: string
      target?: TargetType
      situation?: SituationType
    }

    if (!koreanInput || typeof koreanInput !== 'string') {
      return NextResponse.json({ error: 'koreanInput is required' }, { status: 400 })
    }

    if (koreanInput.length > 500) {
      return NextResponse.json({ error: 'koreanInput is too long (max 500 characters)' }, { status: 400 })
    }

    // Mock 모드 체크
    const useMockMode = !isValidApiKey()

    if (useMockMode) {
      // Mock 모드: API 연결 없이 테스트
      const mockResult = generateMockTranslation(koreanInput, target, situation)

      // Mock Learning Record
      const mockLearningRecord: LearningRecord = {
        id: `mock-${Date.now()}`,
        userId: 'mock-user',
        koreanInput: koreanInput,
        englishExpression: mockResult.mainExpression.english,
        contextExplanation: mockResult.explanation.context,
        alternatives: mockResult.alternatives,
        relatedVocabulary: mockResult.relatedVocabulary,
        category: mockResult.category,
        isBookmarked: false,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1일 후
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return NextResponse.json({
        translationResult: mockResult,
        learningRecord: mockLearningRecord,
        isMock: true,
      })
    }

    // 실제 API 모드: 인증 필요
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 서비스 초기화
    const translationService = new ClaudeTranslationService()
    const learningRecordRepository = new SupabaseLearningRecordRepository(supabase)
    const useCase = new TranslateAndSaveUseCase(translationService, learningRecordRepository)

    // context 생성 (target + situation 정보 포함)
    const contextInfo = buildContextInfo(target, situation)

    // 번역 및 저장 실행
    const result = await useCase.execute({
      userId: user.id,
      koreanInput,
      context: contextInfo,
    })

    return NextResponse.json({
      ...result,
      isMock: false,
    })
  } catch (error) {
    console.error('Translation error:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// target과 situation을 context 문자열로 변환
function buildContextInfo(target: TargetType, situation: SituationType): string {
  const targetMap: Record<TargetType, string> = {
    child: '어린 아이에게 말할 때',
    adult: '성인에게 말할 때',
    colleague: '직장 동료에게 말할 때',
    boss: '상사나 윗사람에게 말할 때',
    stranger: '처음 보는 사람에게 말할 때',
    friend: '친한 친구에게 말할 때',
  }

  const situationMap: Record<SituationType, string> = {
    casual: '캐주얼하고 편한 상황',
    formal: '격식있고 공식적인 상황',
  }

  return `${targetMap[target]}, ${situationMap[situation]}`
}
