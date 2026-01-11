import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/infrastructure/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

const mockFindByUserId = vi.fn()
const mockFindById = vi.fn()
const mockFindDueForReview = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateMasteryLevel = vi.fn()

vi.mock('@/infrastructure/supabase/learning-record-repository', () => ({
  SupabaseLearningRecordRepository: vi.fn().mockImplementation(() => ({
    findByUserId: mockFindByUserId,
    findById: mockFindById,
    findDueForReview: mockFindDueForReview,
    update: mockUpdate,
    updateMasteryLevel: mockUpdateMasteryLevel,
  })),
}))

vi.mock('@/infrastructure/supabase/quiz-attempt-repository', () => ({
  SupabaseQuizAttemptRepository: vi.fn().mockImplementation(() => ({
    create: mockCreate,
  })),
}))

import { createServerSupabaseClient } from '@/infrastructure/supabase/server'
import { POST as generateQuiz } from '../quiz/generate/route'
import { POST as submitQuiz } from '../quiz/submit/route'
import { GET as getDueRecords } from '../quiz/due/route'

describe('Quiz API', () => {
  const mockCreateServerSupabaseClient = createServerSupabaseClient as ReturnType<typeof vi.fn>
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  const mockLearningRecord = {
    id: 'record-123',
    userId: 'user-123',
    koreanInput: '밥 먹었어?',
    englishExpression: 'Have you eaten yet?',
    contextExplanation: 'Test context',
    alternatives: [
      { expression: 'Did you eat?', situation: 'casual', difference: 'More casual' },
    ],
    relatedVocabulary: [],
    category: 'daily',
    isBookmarked: false,
    masteryLevel: 2,
    reviewCount: 5,
    nextReviewAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // 기본적으로 인증된 상태로 설정
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/quiz/generate', () => {
    function createRequest(body: object): NextRequest {
      return new NextRequest('http://localhost:3000/api/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Note: 이 테스트는 Supabase 레포지토리 클래스의 복잡한 모킹이 필요합니다.
    // 실제 DB 연동 테스트는 E2E 또는 통합 테스트에서 수행합니다.
    it.skip('유효한 recordIds로 퀴즈를 생성해야 한다 (통합 테스트 필요)', async () => {
      mockFindByUserId.mockResolvedValue([mockLearningRecord])
      mockFindById.mockResolvedValue(mockLearningRecord)

      const request = createRequest({
        recordIds: ['record-123'],
      })

      const response = await generateQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quizzes).toBeDefined()
      expect(Array.isArray(data.quizzes)).toBe(true)
    })

    it('recordIds가 없으면 400 에러를 반환해야 한다', async () => {
      const request = createRequest({})

      const response = await generateQuiz(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('recordIds')
    })

    it('recordIds가 빈 배열이면 400 에러를 반환해야 한다', async () => {
      const request = createRequest({ recordIds: [] })

      const response = await generateQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('recordIds')
    })

    it('recordIds가 배열이 아니면 400 에러를 반환해야 한다', async () => {
      const request = createRequest({ recordIds: 'not-an-array' })

      const response = await generateQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('인증되지 않은 사용자는 401 에러를 받아야 한다', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      })

      const request = createRequest({ recordIds: ['record-123'] })

      const response = await generateQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it.skip('존재하지 않는 레코드는 null로 필터링되어야 한다 (통합 테스트 필요)', async () => {
      mockFindByUserId.mockResolvedValue([mockLearningRecord])
      mockFindById.mockResolvedValue(null) // 레코드 없음

      const request = createRequest({ recordIds: ['non-existent'] })

      const response = await generateQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quizzes.length).toBe(0)
    })

    it.skip('여러 recordIds를 처리해야 한다 (통합 테스트 필요)', async () => {
      mockFindByUserId.mockResolvedValue([
        mockLearningRecord,
        { ...mockLearningRecord, id: 'record-456' },
      ])
      mockFindById.mockImplementation((id: string) => {
        if (id === 'record-123') return mockLearningRecord
        if (id === 'record-456') return { ...mockLearningRecord, id: 'record-456' }
        return null
      })

      const request = createRequest({ recordIds: ['record-123', 'record-456'] })

      const response = await generateQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.quizzes.length).toBe(2)
    })
  })

  describe('POST /api/quiz/submit', () => {
    function createRequest(body: object): NextRequest {
      return new NextRequest('http://localhost:3000/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validSubmission = {
      recordId: 'record-123',
      quizType: 'korean_to_english',
      question: '밥 먹었어?',
      userAnswer: 'Have you eaten yet?',
      correctAnswer: 'Have you eaten yet?',
      timeTakenMs: 5000,
    }

    describe('유효성 검사', () => {
      it('recordId가 없으면 400 에러를 반환해야 한다', async () => {
        const { recordId: _recordId, ...withoutRecordId } = validSubmission
        const request = createRequest(withoutRecordId)

        const response = await submitQuiz(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('recordId')
      })

      it('유효하지 않은 quizType이면 400 에러를 반환해야 한다', async () => {
        const request = createRequest({
          ...validSubmission,
          quizType: 'invalid_type',
        })

        const response = await submitQuiz(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('quizType')
      })

      it('question이 없으면 400 에러를 반환해야 한다', async () => {
        const { question: _question, ...withoutQuestion } = validSubmission
        const request = createRequest(withoutQuestion)

        const response = await submitQuiz(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('question')
      })

      it('userAnswer가 없으면 400 에러를 반환해야 한다', async () => {
        const { userAnswer: _userAnswer, ...withoutUserAnswer } = validSubmission
        const request = createRequest(withoutUserAnswer)

        const response = await submitQuiz(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('userAnswer')
      })

      it('correctAnswer가 없으면 400 에러를 반환해야 한다', async () => {
        const { correctAnswer: _correctAnswer, ...withoutCorrectAnswer } = validSubmission
        const request = createRequest(withoutCorrectAnswer)

        const response = await submitQuiz(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('correctAnswer')
      })

      it('timeTakenMs가 음수면 400 에러를 반환해야 한다', async () => {
        const request = createRequest({
          ...validSubmission,
          timeTakenMs: -1000,
        })

        const response = await submitQuiz(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('timeTakenMs')
      })

      it('모든 quizType이 허용되어야 한다', async () => {
        const quizTypes = ['korean_to_english', 'fill_blank', 'multiple_choice']

        for (const quizType of quizTypes) {
          mockFindById.mockResolvedValue(mockLearningRecord)
          mockCreate.mockResolvedValue({ id: 'attempt-123' })
          mockUpdateMasteryLevel.mockResolvedValue({ ...mockLearningRecord, masteryLevel: 3 })

          const request = createRequest({
            ...validSubmission,
            quizType,
          })

          const response = await submitQuiz(request)

          // 400 에러가 아니어야 함 (인증 에러나 다른 에러는 OK)
          expect(response.status).not.toBe(400)
        }
      })
    })

    it('인증되지 않은 사용자는 401 에러를 받아야 한다', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      })

      const request = createRequest(validSubmission)

      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/quiz/due', () => {
    // NextRequest는 GET에서 사용하지 않으므로 별도 설정 불필요

    it.skip('복습이 필요한 레코드를 반환해야 한다 (통합 테스트 필요)', async () => {
      mockFindDueForReview.mockResolvedValue([mockLearningRecord])

      const response = await getDueRecords()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.records).toBeDefined()
      expect(Array.isArray(data.records)).toBe(true)
    })

    it('인증되지 않은 사용자는 401 에러를 받아야 한다', async () => {
      mockCreateServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      })

      const response = await getDueRecords()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it.skip('빈 레코드 목록도 정상 반환해야 한다 (통합 테스트 필요)', async () => {
      mockFindDueForReview.mockResolvedValue([])

      const response = await getDueRecords()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.records).toEqual([])
    })
  })
})
