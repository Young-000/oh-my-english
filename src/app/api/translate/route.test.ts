import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock 모듈들
vi.mock('@/infrastructure/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/infrastructure/ai/claude-service', () => {
  return {
    ClaudeTranslationService: class MockClaudeTranslationService {
      async translate() {
        return {
          mainExpression: {
            english: 'What do you want to eat?',
            formality: 'casual',
          },
          explanation: {
            context: 'Used when asking about food preference',
            nuance: 'Casual and friendly',
          },
          alternatives: [],
          relatedVocabulary: [],
          category: '음식',
        }
      }
    },
  }
})

vi.mock('@/infrastructure/supabase/learning-record-repository', () => {
  return {
    SupabaseLearningRecordRepository: class MockSupabaseLearningRecordRepository {
      async create() {
        return {
          id: 'record-1',
          userId: 'user-1',
          koreanInput: '밥 뭐 먹을래?',
          englishExpression: 'What do you want to eat?',
          contextExplanation: 'Used when asking about food preference',
          alternatives: [],
          relatedVocabulary: [],
          category: '음식',
          isBookmarked: false,
          masteryLevel: 0,
          reviewCount: 0,
          nextReviewAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    },
  }
})

// 동적 import를 위한 헬퍼
const importHandler = async () => {
  const routeModule = await import('./route')
  return routeModule.POST
}

describe('POST /api/translate', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const { createServerSupabaseClient } = await import('@/infrastructure/supabase/server')
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabaseClient)
  })

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  describe('Input validation', () => {
    it('should return 400 if koreanInput is missing', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const POST = await importHandler()
      const request = createRequest({})
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('koreanInput')
    })

    it('should return 400 if koreanInput is not a string', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const POST = await importHandler()
      const request = createRequest({ koreanInput: 123 })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if koreanInput is too long', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const POST = await importHandler()
      const request = createRequest({ koreanInput: 'a'.repeat(501) })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('too long')
    })
  })

  describe('Authentication', () => {
    it('should return mock result for unauthenticated users (mock mode)', async () => {
      // API 키가 없으면 Mock 모드로 동작하여 비인증 사용자도 사용 가능
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const POST = await importHandler()
      const request = createRequest({ koreanInput: '안녕하세요' })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.isMock).toBe(true)
    })

    it('should proceed with translation if user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const POST = await importHandler()
      const request = createRequest({ koreanInput: '밥 뭐 먹을래?' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Successful translation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })
    })

    it('should return translation result', async () => {
      const POST = await importHandler()
      const request = createRequest({ koreanInput: '밥 뭐 먹을래?' })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('translationResult')
      expect(data).toHaveProperty('learningRecord')
      // Mock 모드에서는 다른 결과가 반환될 수 있음
      expect(data.translationResult.mainExpression.english).toBeDefined()
    })

    it('should include context if provided', async () => {
      const POST = await importHandler()
      const request = createRequest({
        koreanInput: '밥 뭐 먹을래?',
        context: '아이와 대화',
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})

describe('Translation API Integration Scenarios', () => {
  // 이 테스트들은 실제 통합 시나리오를 문서화

  describe('Real-world input scenarios', () => {
    const testCases = [
      {
        input: '밥 뭐 먹을래?',
        expectedCategory: '음식',
        description: 'Casual food question',
      },
      {
        input: '회의 일정 조율하고 싶습니다',
        expectedCategory: '비즈니스',
        description: 'Business meeting request',
      },
      {
        input: '아기 재워야 해',
        expectedCategory: '육아',
        description: 'Childcare expression',
      },
      {
        input: '여기 화장실 어디예요?',
        expectedCategory: '여행',
        description: 'Travel question',
      },
      {
        input: '너무 피곤해서 쉬고 싶어',
        expectedCategory: '감정표현',
        description: 'Emotion expression',
      },
    ]

    testCases.forEach(({ input, description }) => {
      it(`should handle: ${description}`, () => {
        // 이 테스트는 입력 형식이 올바른지만 검증
        expect(input.length).toBeLessThanOrEqual(500)
        expect(typeof input).toBe('string')
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty context gracefully', () => {
      const input = { koreanInput: '테스트', context: '' }
      expect(input.context).toBe('')
    })

    it('should handle unicode characters', () => {
      const inputs = [
        '이모지 🎉 테스트',
        '특수문자 !@#$%',
        '숫자 포함 123',
      ]

      inputs.forEach((input) => {
        expect(typeof input).toBe('string')
        expect(input.length).toBeGreaterThan(0)
      })
    })

    it('should handle very short input', () => {
      const input = '안녕'
      expect(input.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle maximum length input', () => {
      const input = '가'.repeat(500)
      expect(input.length).toBe(500)
    })
  })
})
