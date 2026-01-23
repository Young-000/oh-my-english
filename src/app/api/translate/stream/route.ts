import { NextRequest } from 'next/server';
import { ClaudeTranslationService } from '@/infrastructure/ai/claude-service';
import { TranslationCache } from '@/infrastructure/cache/translation-cache';
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { withRateLimit } from '@/infrastructure/rate-limit';
import {
  ValidationError,
  RateLimitError,
  isTranslationError,
} from '@/domain/errors/translation-errors';
import {
  formatErrorResponse,
  formatStreamError,
  logError,
  handleAnthropicError,
} from '@/infrastructure/errors/error-handler';
import type { TargetType, SituationType } from '@/presentation/components/TranslationInput';
import type { LearningRecord, TranslationResult } from '@/domain/entities/translation';

// Edge Runtime for lower latency
export const runtime = 'edge';
export const preferredRegion = ['icn1']; // Seoul region

// API 키가 유효한지 확인
function isValidApiKey(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'placeholder_api_key' || !apiKey.startsWith('sk-')) {
    return false
  }
  return true
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

// 학습 레코드 생성 헬퍼
function createLearningRecord(
  userId: string,
  koreanInput: string,
  translationResult: TranslationResult
): LearningRecord {
  return {
    id: userId === 'anonymous' ? `temp-${Date.now()}` : '',
    userId,
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

export async function POST(request: NextRequest) {
  // Rate Limiting 체크
  const rateLimitResponse = withRateLimit(request, 'translation');
  if (rateLimitResponse) {
    // Rate limit 에러를 구조화된 응답으로 변환
    const rateLimitError = new RateLimitError(20, 60000);
    logError(rateLimitError, { endpoint: '/api/translate/stream' });
    const { response, statusCode } = formatErrorResponse(rateLimitError);
    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimitError.getRetryAfterSeconds()),
      },
    });
  }

  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const { koreanInput, target = 'adult', situation = 'casual' } = body as {
      koreanInput: string;
      target?: TargetType;
      situation?: SituationType;
    };

    // 입력 검증
    if (!koreanInput || typeof koreanInput !== 'string') {
      const error = ValidationError.emptyInput();
      logError(error, { endpoint: '/api/translate/stream' });
      const { response, statusCode } = formatErrorResponse(error);
      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (koreanInput.trim().length === 0) {
      const error = ValidationError.emptyInput();
      logError(error, { endpoint: '/api/translate/stream' });
      const { response, statusCode } = formatErrorResponse(error);
      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const MAX_INPUT_LENGTH = 500;
    if (koreanInput.length > MAX_INPUT_LENGTH) {
      const error = ValidationError.tooLong(MAX_INPUT_LENGTH, koreanInput.length);
      logError(error, { endpoint: '/api/translate/stream', inputLength: koreanInput.length });
      const { response, statusCode } = formatErrorResponse(error);
      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasValidApiKey = isValidApiKey()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 캐시 확인 (API 키가 유효할 때만)
    if (hasValidApiKey) {
      const cache = new TranslationCache(supabase)
      const cached = await cache.get(koreanInput, target, situation)

      if (cached) {
        // 캐시 히트 - 즉시 전체 결과 반환
        const learningRecord = user
          ? await new SupabaseLearningRecordRepository(supabase).create({
              userId: user.id,
              koreanInput,
              translationResult: cached.translationResult,
            })
          : createLearningRecord('anonymous', koreanInput, cached.translationResult)

        const result = {
          type: 'complete',
          translationResult: cached.translationResult,
          learningRecord,
          isMock: false,
          isLoggedIn: !!user,
          fromCache: true,
          cacheHits: cached.hitCount + 1,
        }

        return new Response(
          `data: ${JSON.stringify(result)}\n\n`,
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          }
        )
      }
    }

    // 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!hasValidApiKey) {
            // Mock 모드
            const { generateMockTranslation } = await import('@/lib/mock/translation-mock')
            const mockResult = generateMockTranslation(koreanInput, target, situation)
            const learningRecord = createLearningRecord('mock-user', koreanInput, mockResult)

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'complete',
                  translationResult: mockResult,
                  learningRecord,
                  isMock: true,
                  isLoggedIn: false,
                })}\n\n`
              )
            )
            controller.close()
            return
          }

          // Claude API with streaming progress events
          const translationService = new ClaudeTranslationService()
          const contextInfo = buildContextInfo(target, situation)

          // 진행 상태 이벤트 전송 - 사용자에게 번역 중임을 알림
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'progress', stage: 'translating', message: '번역 중...' })}\n\n`
            )
          )

          // 빠른 번역 실행
          const translationResult = await translationService.translate({
            koreanInput,
            context: contextInfo,
          })

          // 분석 완료 알림
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'progress', stage: 'analyzing', message: '표현 분석 중...' })}\n\n`
            )
          )

          // 캐시에 저장
          const cache = new TranslationCache(supabase)
          cache.set(koreanInput, target, situation, translationResult).catch(console.error)

          // 학습 레코드 처리
          let learningRecord: LearningRecord
          if (user) {
            const repo = new SupabaseLearningRecordRepository(supabase)
            learningRecord = await repo.create({
              userId: user.id,
              koreanInput,
              translationResult,
            })
          } else {
            learningRecord = createLearningRecord('anonymous', koreanInput, translationResult)
          }

          // 완료 이벤트
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                translationResult,
                learningRecord,
                isMock: false,
                isLoggedIn: !!user,
                fromCache: false,
              })}\n\n`
            )
          )
        } catch (error) {
          // 에러 변환 및 로깅
          const translationError = isTranslationError(error)
            ? error
            : handleAnthropicError(error);

          logError(translationError, {
            endpoint: '/api/translate/stream',
            method: 'POST',
            streaming: true,
          });

          const streamError = formatStreamError(translationError);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(streamError)}\n\n`)
          );
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    // 에러 변환 및 로깅
    const translationError = isTranslationError(error)
      ? error
      : handleAnthropicError(error);

    logError(translationError, {
      endpoint: '/api/translate/stream',
      method: 'POST',
    });

    const { response, statusCode } = formatErrorResponse(translationError);
    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
