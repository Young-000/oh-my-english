import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock 모듈들
vi.mock('@/infrastructure/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/infrastructure/supabase/learning-record-repository', () => {
  return {
    SupabaseLearningRecordRepository: class MockLearningRecordRepository {
      async findById(id: string) {
        if (id === 'non-existent') return null
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
          masteryLevel: 2,
          reviewCount: 3,
          nextReviewAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
      async update(id: string, data: Record<string, unknown>) {
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
          masteryLevel: data.masteryLevel ?? 3,
          reviewCount: data.reviewCount ?? 4,
          nextReviewAt: data.nextReviewAt ?? new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    },
  }
})

vi.mock('@/infrastructure/supabase/quiz-attempt-repository', () => {
  return {
    SupabaseQuizAttemptRepository: class MockQuizAttemptRepository {
      async create(input: Record<string, unknown>) {
        return {
          id: 'attempt-1',
          userId: input.userId,
          recordId: input.recordId,
          quizType: input.quizType,
          question: input.question,
          userAnswer: input.userAnswer,
          correctAnswer: input.correctAnswer,
          isCorrect: input.isCorrect,
          timeTakenMs: input.timeTakenMs,
          createdAt: new Date(),
        }
      }
    },
  }
})

const importHandler = async () => {
  const routeModule = await import('./route')
  return routeModule.POST
}

describe('POST /api/quiz/submit', () => {
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
    return new NextRequest('http://localhost:3000/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  describe('Input validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })
    })

    it('should return 400 if recordId is missing', async () => {
      const POST = await importHandler()
      const request = createRequest({
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'test',
        correctAnswer: 'test',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('recordId')
    })

    it('should return 400 if quizType is invalid', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'invalid_type',
        question: '테스트',
        userAnswer: 'test',
        correctAnswer: 'test',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('quizType')
    })

    it('should return 400 if question is missing', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        userAnswer: 'test',
        correctAnswer: 'test',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if userAnswer is missing', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '테스트',
        correctAnswer: 'test',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if timeTakenMs is negative', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'test',
        correctAnswer: 'test',
        timeTakenMs: -1,
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Successful submission', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })
    })

    it('should grade correct answer and return result', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.quizResult.isCorrect).toBe(true)
      expect(data.quizAttempt).toBeDefined()
      expect(data.updatedRecord).toBeDefined()
    })

    it('should grade incorrect answer and return result', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'Hello world',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.quizResult.isCorrect).toBe(false)
      expect(data.quizResult.feedback).toContain('What do you want to eat?')
    })

    it('should handle multiple choice quiz type', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'multiple_choice',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 2000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.quizResult.isCorrect).toBe(true)
    })

    it('should handle fill_blank quiz type', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'fill_blank',
        question: '"What do you _____ to eat?"',
        userAnswer: 'want',
        correctAnswer: 'want',
        timeTakenMs: 3000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.quizResult.isCorrect).toBe(true)
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })
    })

    it('should return 404 if record not found', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'non-existent',
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'test',
        correctAnswer: 'test',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })
  })
})

describe('Quiz grading integration', () => {
  describe('Similarity-based grading', () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    }

    beforeEach(async () => {
      vi.clearAllMocks()
      const { createServerSupabaseClient } = await import('@/infrastructure/supabase/server')
      ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabaseClient)
    })

    const createRequest = (body: object) => {
      return new NextRequest('http://localhost:3000/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    it('should accept answers with minor typos (90%+ similarity)', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eatt?', // 오타
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.quizResult.isCorrect).toBe(true)
    })

    it('should be case insensitive', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'WHAT DO YOU WANT TO EAT?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.quizResult.isCorrect).toBe(true)
    })

    it('should ignore punctuation differences', async () => {
      const POST = await importHandler()
      const request = createRequest({
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.quizResult.isCorrect).toBe(true)
    })
  })
})
