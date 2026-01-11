import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/infrastructure/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/infrastructure/ai/claude-service', () => ({
  ClaudeTranslationService: vi.fn().mockImplementation(() => ({
    translate: vi.fn().mockResolvedValue({
      mainExpression: { english: 'Test', formality: 'casual' },
      explanation: { context: 'Test context', nuance: 'Test nuance' },
      alternatives: [],
      relatedVocabulary: [],
      category: 'daily',
    }),
  })),
}))

vi.mock('@/infrastructure/supabase/learning-record-repository', () => ({
  SupabaseLearningRecordRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: 'mock-record-id',
      userId: 'user-123',
      koreanInput: '테스트',
      englishExpression: 'Test',
      contextExplanation: 'Test context',
      alternatives: [],
      relatedVocabulary: [],
      category: 'daily',
      isBookmarked: false,
      masteryLevel: 0,
      reviewCount: 0,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  })),
}))

// Re-import after mocking
import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import { POST } from '../translate/route'

describe('POST /api/translate', () => {
  const mockCreateServerSupabaseClient = createServerSupabaseClient as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createMockRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  describe('Mock 모드 (API 키 없음)', () => {
    beforeEach(() => {
      // API 키를 placeholder로 설정하여 Mock 모드 활성화
      vi.stubEnv('ANTHROPIC_API_KEY', 'placeholder_api_key')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('유효한 요청에 대해 Mock 응답을 반환해야 한다', async () => {
      const request = createMockRequest({
        koreanInput: '밥 먹었어?',
        target: 'friend',
        situation: 'casual',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isMock).toBe(true)
      expect(data.translationResult).toBeDefined()
      expect(data.learningRecord).toBeDefined()
    })

    it('기본 target과 situation이 적용되어야 한다', async () => {
      const request = createMockRequest({
        koreanInput: '밥 먹었어?',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isMock).toBe(true)
    })

    it('translationResult가 올바른 구조를 가져야 한다', async () => {
      const request = createMockRequest({
        koreanInput: '밥 먹었어?',
        target: 'adult',
        situation: 'formal',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.translationResult.mainExpression).toBeDefined()
      expect(data.translationResult.explanation).toBeDefined()
      expect(data.translationResult.alternatives).toBeDefined()
      expect(data.translationResult.relatedVocabulary).toBeDefined()
    })

    it('learningRecord가 생성되어야 한다', async () => {
      const request = createMockRequest({
        koreanInput: '밥 먹었어?',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.learningRecord.id).toBeDefined()
      expect(data.learningRecord.id).toContain('mock-')
      expect(data.learningRecord.koreanInput).toBe('밥 먹었어?')
    })
  })

  describe('유효성 검사', () => {
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'placeholder_api_key')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('koreanInput이 없으면 400 에러를 반환해야 한다', async () => {
      const request = createMockRequest({})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('koreanInput')
    })

    it('koreanInput이 문자열이 아니면 400 에러를 반환해야 한다', async () => {
      const request = createMockRequest({
        koreanInput: 123,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('koreanInput')
    })

    it('koreanInput이 500자를 초과하면 400 에러를 반환해야 한다', async () => {
      const longInput = '가'.repeat(501)
      const request = createMockRequest({
        koreanInput: longInput,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('long')
    })

    it('koreanInput이 정확히 500자면 성공해야 한다', async () => {
      const exactInput = '가'.repeat(500)
      const request = createMockRequest({
        koreanInput: exactInput,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('실제 API 모드 (인증 선택적)', () => {
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-valid-api-key')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    // Note: 실제 API 모드에서는 인증이 선택적입니다.
    // 비로그인 사용자도 Claude API를 통한 번역이 가능하며, DB 저장만 안 됩니다.
    // 실제 번역 기능은 UseCase와 ClaudeTranslationService의 복잡한 의존성으로 인해
    // E2E 테스트에서 검증합니다.

    it.skip('인증되지 않은 사용자도 번역 결과를 받아야 한다 (통합 테스트 필요)', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      })

      const request = createMockRequest({
        koreanInput: '테스트',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isMock).toBe(false)
      expect(data.isLoggedIn).toBe(false)
    })

    it.skip('인증된 사용자는 번역 결과와 함께 DB 저장이 되어야 한다 (통합 테스트 필요)', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
      })

      const request = createMockRequest({
        koreanInput: '테스트',
        target: 'friend',
        situation: 'casual',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isMock).toBe(false)
      expect(data.isLoggedIn).toBe(true)
    })
  })

  describe('Target × Situation 조합', () => {
    const targets = ['child', 'adult', 'colleague', 'boss', 'stranger', 'friend'] as const
    const situations = ['casual', 'formal'] as const

    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'placeholder_api_key')
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    targets.forEach((target) => {
      situations.forEach((situation) => {
        it(`${target} + ${situation} 조합이 성공해야 한다`, async () => {
          const request = createMockRequest({
            koreanInput: '밥 먹었어?',
            target,
            situation,
          })

          const response = await POST(request)

          expect(response.status).toBe(200)
        })
      })
    })
  })
})
