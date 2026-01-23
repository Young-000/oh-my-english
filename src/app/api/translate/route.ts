import { NextRequest, NextResponse } from 'next/server';
import { ClaudeTranslationService } from '@/infrastructure/ai/claude-service';
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { generateMockTranslation } from '@/lib/mock/translation-mock';
import { lookupExpression } from '@/infrastructure/vocabulary/vocabulary-lookup-service';
import {
  ValidationError,
  isTranslationError,
} from '@/domain/errors/translation-errors';
import {
  formatErrorResponse,
  logError,
  handleAnthropicError,
} from '@/infrastructure/errors/error-handler';
import type { TargetType, SituationType } from '@/presentation/components/TranslationInput';
import type { LearningRecord } from '@/domain/entities/translation';
import type { TranslationResult } from '@/domain/entities/translation';

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

    // 입력 검증
    if (!koreanInput || typeof koreanInput !== 'string') {
      const error = ValidationError.emptyInput();
      logError(error, { endpoint: '/api/translate' });
      const { response, statusCode } = formatErrorResponse(error);
      return NextResponse.json(response, { status: statusCode });
    }

    if (koreanInput.trim().length === 0) {
      const error = ValidationError.emptyInput();
      logError(error, { endpoint: '/api/translate' });
      const { response, statusCode } = formatErrorResponse(error);
      return NextResponse.json(response, { status: statusCode });
    }

    const MAX_INPUT_LENGTH = 500;
    if (koreanInput.length > MAX_INPUT_LENGTH) {
      const error = ValidationError.tooLong(MAX_INPUT_LENGTH, koreanInput.length);
      logError(error, { endpoint: '/api/translate', inputLength: koreanInput.length });
      const { response, statusCode } = formatErrorResponse(error);
      return NextResponse.json(response, { status: statusCode });
    }

    // API 키 유효성 체크
    const hasValidApiKey = isValidApiKey()

    // Mock 모드: API 키가 없을 때만
    if (!hasValidApiKey) {
      const mockResult = generateMockTranslation(koreanInput, target, situation)

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
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return NextResponse.json({
        translationResult: mockResult,
        learningRecord: mockLearningRecord,
        isMock: true,
      })
    }

    // 1. 먼저 단어장 DB에서 빠르게 검색 (응답 시간 단축)
    const vocabularyLookup = await lookupExpression(koreanInput)

    if (vocabularyLookup.found) {
      // 단어장에서 찾음 - 즉시 응답 (API 호출 없음)
      const vocabData = vocabularyLookup.data
      const translationResult: TranslationResult = {
        mainExpression: {
          english: vocabData.english,
          formality: situation === 'formal' ? 'formal' : 'casual',
        },
        alternatives: vocabData.alternatives.map(alt => ({
          expression: alt.english_expression,
          situation: alt.context_explanation || 'similar expression',
          difference: alt.context_explanation || '',
        })),
        explanation: {
          context: vocabData.explanation || '단어장에서 제공하는 표현입니다.',
          nuance: vocabData.pronunciation ? `발음: ${vocabData.pronunciation}` : '',
        },
        relatedVocabulary: [],
        category: vocabData.category,
      }

      const learningRecord: LearningRecord = {
        id: `vocab-${Date.now()}`,
        userId: 'vocabulary',
        koreanInput,
        englishExpression: vocabData.english,
        contextExplanation: vocabData.explanation || '',
        alternatives: translationResult.alternatives,
        relatedVocabulary: [],
        category: vocabData.category,
        isBookmarked: false,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return NextResponse.json({
        translationResult,
        learningRecord,
        isMock: false,
        isFromVocabulary: true,
        responseTime: 'fast',
      })
    }

    // 2. 단어장에 없으면 Claude API 사용
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Claude API로 번역 실행
    const translationService = new ClaudeTranslationService()
    const contextInfo = buildContextInfo(target, situation)

    // 번역 결과 가져오기
    const translationResult = await translationService.translate({
      koreanInput,
      context: contextInfo,
    })

    // 로그인된 사용자만 DB에 저장
    let learningRecord: LearningRecord | null = null
    if (user) {
      const learningRecordRepository = new SupabaseLearningRecordRepository(supabase)
      learningRecord = await learningRecordRepository.create({
        userId: user.id,
        koreanInput,
        translationResult,
      })
    } else {
      // 비로그인 사용자는 임시 레코드 생성 (저장 안 함)
      learningRecord = {
        id: `temp-${Date.now()}`,
        userId: 'anonymous',
        koreanInput,
        englishExpression: translationResult.mainExpression.english,
        contextExplanation: translationResult.explanation.context,
        alternatives: translationResult.alternatives,
        relatedVocabulary: translationResult.relatedVocabulary,
        category: translationResult.category,
        isBookmarked: false,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return NextResponse.json({
      translationResult,
      learningRecord,
      isMock: false,
      isLoggedIn: !!user,
    })
  } catch (error) {
    // 에러 변환 및 로깅
    const translationError = isTranslationError(error)
      ? error
      : handleAnthropicError(error);

    logError(translationError, {
      endpoint: '/api/translate',
      method: 'POST',
    });

    const { response, statusCode } = formatErrorResponse(translationError);
    return NextResponse.json(response, { status: statusCode });
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
