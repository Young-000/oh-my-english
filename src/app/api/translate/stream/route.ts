import { NextRequest } from 'next/server'
import { ClaudeTranslationService } from '@/infrastructure/ai/claude-service'
import { TranslationCache } from '@/infrastructure/cache/translation-cache'
import { SupabaseLearningRecordRepository } from '@/infrastructure/supabase/learning-record-repository'
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import type { TargetType, SituationType } from '@/presentation/components/TranslationInput'
import type { LearningRecord, TranslationResult } from '@/domain/entities/translation'

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
  const encoder = new TextEncoder()

  try {
    const body = await request.json()
    const { koreanInput, target = 'adult', situation = 'casual' } = body as {
      koreanInput: string
      target?: TargetType
      situation?: SituationType
    }

    if (!koreanInput || typeof koreanInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'koreanInput is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (koreanInput.length > 500) {
      return new Response(
        JSON.stringify({ error: 'koreanInput is too long (max 500 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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

          // Claude API 스트리밍
          const translationService = new ClaudeTranslationService()
          const contextInfo = buildContextInfo(target, situation)

          // 스트리밍 대신 일반 번역 사용 (응답 텍스트를 누적하면서 청크 전송)
          const translationResult = await translationService.translate({
            koreanInput,
            context: contextInfo,
          })

          // 결과를 청크로 전송 (타이핑 효과)
          const resultJson = JSON.stringify(translationResult)
          const chunkSize = 50
          for (let i = 0; i < resultJson.length; i += chunkSize) {
            const chunk = resultJson.slice(i, i + chunkSize)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
            )
            // 약간의 딜레이로 타이핑 효과 (실제 스트리밍처럼 보이게)
            await new Promise(resolve => setTimeout(resolve, 10))
          }

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
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          )
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
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
