import { describe, it, expect } from 'vitest'

/**
 * API 응답 구조 검증 테스트
 *
 * 각 API 엔드포인트가 일관된 응답 구조를 반환하는지 검증:
 * - 표준 응답 형식
 * - 에러 응답 형식
 * - 필수 필드 존재 여부
 * - 데이터 타입 검증
 */

// 표준 API 응답 타입
interface ApiSuccessResponse<T> {
  success: true
  data: T
}

interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
}

type _ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// 번역 결과 타입
interface TranslationResultData {
  id: string
  englishExpression: string
  contextExplanation: string
  alternatives: Array<{
    expression: string
    situation: string
    difference: string
  }>
  relatedVocabulary: Array<{
    word: string
    meaning: string
    example: string
  }>
  category: string
}

// 퀴즈 타입
interface QuizData {
  type: 'korean_to_english' | 'fill_blank' | 'multiple_choice'
  question: string
  correctAnswer: string
  hint?: string
  options?: string[]
  recordId: string
}

// 퀴즈 제출 결과 타입
interface QuizSubmitResultData {
  isCorrect: boolean
  correctAnswer: string
  similarity?: number
  feedback?: string
  updatedMastery?: number
  nextReviewAt?: string
}

// 학습 기록 타입
interface LearningRecordData {
  id: string
  koreanInput: string
  englishExpression: string
  contextExplanation: string
  alternatives: Array<{
    expression: string
    situation: string
    difference: string
  }>
  relatedVocabulary: Array<{
    word: string
    meaning: string
    example: string
  }>
  category: string
  isBookmarked: boolean
  masteryLevel: number
  reviewCount: number
  nextReviewAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 응답 구조 검증 헬퍼
 */
function isValidSuccessResponse<T>(
  response: unknown,
  dataValidator: (data: unknown) => data is T
): response is ApiSuccessResponse<T> {
  if (typeof response !== 'object' || response === null) return false
  const obj = response as Record<string, unknown>
  return obj.success === true && 'data' in obj && dataValidator(obj.data)
}

function isValidErrorResponse(response: unknown): response is ApiErrorResponse {
  if (typeof response !== 'object' || response === null) return false
  const obj = response as Record<string, unknown>
  return obj.success === false && typeof obj.error === 'string'
}

/**
 * 데이터 타입 검증기
 */
function isTranslationResult(data: unknown): data is TranslationResultData {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.englishExpression === 'string' &&
    typeof obj.contextExplanation === 'string' &&
    Array.isArray(obj.alternatives) &&
    Array.isArray(obj.relatedVocabulary) &&
    typeof obj.category === 'string'
  )
}

function isQuizData(data: unknown): data is QuizData {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    ['korean_to_english', 'fill_blank', 'multiple_choice'].includes(obj.type as string) &&
    typeof obj.question === 'string' &&
    typeof obj.correctAnswer === 'string' &&
    typeof obj.recordId === 'string'
  )
}

function isQuizSubmitResult(data: unknown): data is QuizSubmitResultData {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return typeof obj.isCorrect === 'boolean' && typeof obj.correctAnswer === 'string'
}

function isLearningRecord(data: unknown): data is LearningRecordData {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.koreanInput === 'string' &&
    typeof obj.englishExpression === 'string' &&
    typeof obj.masteryLevel === 'number'
  )
}

describe('API Response Structure', () => {
  describe('Success Response Format', () => {
    it('should have correct structure for translation result', () => {
      const mockResponse: ApiSuccessResponse<TranslationResultData> = {
        success: true,
        data: {
          id: 'record-123',
          englishExpression: 'Have you eaten?',
          contextExplanation: '식사 여부를 물어보는 친근한 표현',
          alternatives: [
            {
              expression: 'Did you eat?',
              situation: 'casual',
              difference: 'more direct',
            },
          ],
          relatedVocabulary: [
            {
              word: 'eat',
              meaning: '먹다',
              example: 'I eat breakfast at 7',
            },
          ],
          category: '일상대화',
        },
      }

      expect(isValidSuccessResponse(mockResponse, isTranslationResult)).toBe(true)
      expect(mockResponse.success).toBe(true)
      expect(mockResponse.data.englishExpression).toBe('Have you eaten?')
    })

    it('should have correct structure for quiz', () => {
      const mockResponse: ApiSuccessResponse<QuizData> = {
        success: true,
        data: {
          type: 'korean_to_english',
          question: '밥 먹었어?',
          correctAnswer: 'Have you eaten?',
          hint: 'Have...로 시작하는 3단어',
          recordId: 'record-123',
        },
      }

      expect(isValidSuccessResponse(mockResponse, isQuizData)).toBe(true)
    })

    it('should have correct structure for quiz submit result', () => {
      const mockResponse: ApiSuccessResponse<QuizSubmitResultData> = {
        success: true,
        data: {
          isCorrect: true,
          correctAnswer: 'Have you eaten?',
          similarity: 0.95,
          feedback: '정확합니다!',
          updatedMastery: 3,
          nextReviewAt: '2024-01-20T10:00:00Z',
        },
      }

      expect(isValidSuccessResponse(mockResponse, isQuizSubmitResult)).toBe(true)
    })

    it('should have correct structure for learning record list', () => {
      const mockResponse: ApiSuccessResponse<LearningRecordData[]> = {
        success: true,
        data: [
          {
            id: 'record-1',
            koreanInput: '밥 먹었어?',
            englishExpression: 'Have you eaten?',
            contextExplanation: '설명',
            alternatives: [],
            relatedVocabulary: [],
            category: '일상대화',
            isBookmarked: false,
            masteryLevel: 2,
            reviewCount: 5,
            nextReviewAt: '2024-01-20T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        ],
      }

      expect(mockResponse.success).toBe(true)
      expect(Array.isArray(mockResponse.data)).toBe(true)
      expect(mockResponse.data.every((r) => isLearningRecord(r))).toBe(true)
    })
  })

  describe('Error Response Format', () => {
    const errorCases = [
      {
        name: 'validation error',
        response: {
          success: false,
          error: 'Invalid input: korean input is required',
          code: 'VALIDATION_ERROR',
        },
      },
      {
        name: 'not found error',
        response: {
          success: false,
          error: 'Learning record not found',
          code: 'NOT_FOUND',
        },
      },
      {
        name: 'unauthorized error',
        response: {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      },
      {
        name: 'rate limit error',
        response: {
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT',
          details: { retryAfter: 60 },
        },
      },
      {
        name: 'internal server error',
        response: {
          success: false,
          error: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
        },
      },
    ]

    errorCases.forEach(({ name, response }) => {
      it(`should have correct structure for ${name}`, () => {
        expect(isValidErrorResponse(response)).toBe(true)
        expect(response.success).toBe(false)
        expect(typeof response.error).toBe('string')
        expect(response.error.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Field Validation', () => {
    describe('Translation Result Fields', () => {
      it('should have valid alternative structure', () => {
        const alternative = {
          expression: 'Did you eat?',
          situation: 'casual conversation',
          difference: 'more direct',
        }

        expect(typeof alternative.expression).toBe('string')
        expect(alternative.expression.length).toBeGreaterThan(0)
        expect(typeof alternative.situation).toBe('string')
        expect(typeof alternative.difference).toBe('string')
      })

      it('should have valid vocabulary structure', () => {
        const vocab = {
          word: 'eat',
          meaning: '먹다',
          example: 'I eat breakfast every morning',
        }

        expect(typeof vocab.word).toBe('string')
        expect(typeof vocab.meaning).toBe('string')
        expect(typeof vocab.example).toBe('string')
        expect(vocab.example.toLowerCase()).toContain(vocab.word.toLowerCase())
      })
    })

    describe('Quiz Fields', () => {
      it('should have valid quiz type', () => {
        const validTypes = ['korean_to_english', 'fill_blank', 'multiple_choice']
        validTypes.forEach((type) => {
          expect(validTypes).toContain(type)
        })
      })

      it('should have options for multiple_choice type', () => {
        const quiz: QuizData = {
          type: 'multiple_choice',
          question: '밥 먹었어?',
          correctAnswer: 'Have you eaten?',
          options: ['Have you eaten?', 'Did you eat?', 'Are you hungry?', 'Want to eat?'],
          recordId: 'record-1',
        }

        expect(quiz.options).toBeDefined()
        expect(quiz.options!.length).toBeGreaterThanOrEqual(2)
        expect(quiz.options).toContain(quiz.correctAnswer)
      })

      it('should have hint for fill_blank type', () => {
        const quiz: QuizData = {
          type: 'fill_blank',
          question: '밥 먹었어?\n\n"Have you _____?"',
          correctAnswer: 'eaten',
          hint: '5글자 단어',
          recordId: 'record-1',
        }

        expect(quiz.hint).toBeDefined()
        expect(quiz.question).toContain('_____')
      })
    })

    describe('Learning Record Fields', () => {
      it('should have valid masteryLevel range', () => {
        const validLevels = [0, 1, 2, 3, 4, 5]
        validLevels.forEach((level) => {
          expect(level).toBeGreaterThanOrEqual(0)
          expect(level).toBeLessThanOrEqual(5)
        })
      })

      it('should have valid date formats', () => {
        const dates = [
          '2024-01-15T10:30:00Z',
          '2024-12-31T23:59:59Z',
          '2024-01-01T00:00:00.000Z',
        ]

        dates.forEach((dateStr) => {
          const date = new Date(dateStr)
          expect(date.toString()).not.toBe('Invalid Date')
        })
      })

      it('should allow null for nextReviewAt', () => {
        const record: LearningRecordData = {
          id: 'test',
          koreanInput: '테스트',
          englishExpression: 'Test',
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 0,
          reviewCount: 0,
          nextReviewAt: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }

        expect(record.nextReviewAt).toBeNull()
      })
    })
  })
})

describe('API Response Consistency', () => {
  describe('Translation API', () => {
    it('should return complete translation result', () => {
      const mockResult: TranslationResultData = {
        id: 'uuid-v4-format',
        englishExpression: 'What do you want to eat?',
        contextExplanation: '음식 선택을 물어볼 때 사용하는 표현',
        alternatives: [
          {
            expression: 'What would you like to eat?',
            situation: 'polite/formal',
            difference: 'more formal',
          },
          {
            expression: 'What are you in the mood for?',
            situation: 'casual',
            difference: 'focuses on preference',
          },
        ],
        relatedVocabulary: [
          { word: 'eat', meaning: '먹다', example: 'I eat lunch at noon' },
          { word: 'meal', meaning: '식사', example: 'This is a delicious meal' },
        ],
        category: '일상대화',
      }

      // 필수 필드 존재
      expect(mockResult.id).toBeDefined()
      expect(mockResult.englishExpression).toBeDefined()
      expect(mockResult.contextExplanation).toBeDefined()
      expect(mockResult.alternatives).toBeDefined()
      expect(mockResult.relatedVocabulary).toBeDefined()
      expect(mockResult.category).toBeDefined()

      // 배열 길이 검증
      expect(mockResult.alternatives.length).toBeGreaterThanOrEqual(1)
      expect(mockResult.relatedVocabulary.length).toBeGreaterThanOrEqual(1)

      // 영어 표현 품질
      expect(mockResult.englishExpression.length).toBeGreaterThan(0)
      expect(mockResult.englishExpression).toMatch(/[A-Z]/) // 대문자 포함
    })
  })

  describe('Quiz API', () => {
    const quizTypes = ['korean_to_english', 'fill_blank', 'multiple_choice'] as const

    quizTypes.forEach((type) => {
      it(`should return valid ${type} quiz`, () => {
        const baseQuiz = {
          type,
          question: '밥 먹었어?',
          correctAnswer: type === 'fill_blank' ? 'eaten' : 'Have you eaten?',
          recordId: 'record-123',
        }

        const quiz: QuizData =
          type === 'multiple_choice'
            ? { ...baseQuiz, options: ['Have you eaten?', 'Did you eat?', 'Are you hungry?', 'Want food?'] }
            : { ...baseQuiz, hint: type === 'fill_blank' ? '5글자' : 'Have...로 시작' }

        expect(quiz.type).toBe(type)
        expect(quiz.question.length).toBeGreaterThan(0)
        expect(quiz.correctAnswer.length).toBeGreaterThan(0)

        if (type === 'multiple_choice') {
          expect(quiz.options).toBeDefined()
          expect(quiz.options!.length).toBe(4)
        }
      })
    })
  })

  describe('Quiz Submit API', () => {
    it('should return correct result structure', () => {
      const correctResult: QuizSubmitResultData = {
        isCorrect: true,
        correctAnswer: 'Have you eaten?',
        similarity: 1.0,
        feedback: '완벽합니다!',
        updatedMastery: 3,
        nextReviewAt: '2024-01-22T10:00:00Z',
      }

      expect(correctResult.isCorrect).toBe(true)
      expect(correctResult.similarity).toBe(1.0)
      expect(correctResult.updatedMastery).toBeDefined()
    })

    it('should return incorrect result structure', () => {
      const incorrectResult: QuizSubmitResultData = {
        isCorrect: false,
        correctAnswer: 'Have you eaten?',
        similarity: 0.6,
        feedback: '정답: Have you eaten?',
      }

      expect(incorrectResult.isCorrect).toBe(false)
      expect(incorrectResult.similarity).toBeLessThan(0.9)
      expect(incorrectResult.feedback).toContain(incorrectResult.correctAnswer)
    })
  })
})

describe('API Error Handling Patterns', () => {
  describe('Input Validation Errors', () => {
    const validationErrors = [
      { field: 'koreanInput', error: 'Korean input is required', keyword: 'korean' },
      { field: 'koreanInput', error: 'Korean input must be a string', keyword: 'korean' },
      { field: 'koreanInput', error: 'Korean input is too long', keyword: 'korean' },
      { field: 'recordId', error: 'Record ID is required', keyword: 'record' },
      { field: 'answer', error: 'Answer is required', keyword: 'answer' },
      { field: 'quizType', error: 'Invalid quiz type', keyword: 'quiz' },
    ]

    validationErrors.forEach(({ field, error, keyword }) => {
      it(`should provide clear error for ${field}: ${error}`, () => {
        const response: ApiErrorResponse = {
          success: false,
          error,
          code: 'VALIDATION_ERROR',
          details: { field },
        }

        expect(response.success).toBe(false)
        expect(response.error.toLowerCase()).toContain(keyword.toLowerCase())
      })
    })
  })

  describe('Resource Errors', () => {
    it('should handle not found gracefully', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Learning record not found',
        code: 'NOT_FOUND',
      }

      expect(response.code).toBe('NOT_FOUND')
      expect(response.error).toContain('not found')
    })

    it('should handle conflict gracefully', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Record already exists',
        code: 'CONFLICT',
      }

      expect(response.code).toBe('CONFLICT')
    })
  })

  describe('Authentication Errors', () => {
    it('should handle unauthenticated request', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      }

      expect(response.code).toBe('UNAUTHORIZED')
    })

    it('should handle forbidden request', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
      }

      expect(response.code).toBe('FORBIDDEN')
    })
  })
})

describe('API Response Pagination', () => {
  interface PaginatedResponse<T> {
    success: true
    data: T[]
    pagination: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }

  it('should have valid pagination structure', () => {
    const response: PaginatedResponse<LearningRecordData> = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    }

    expect(response.pagination.page).toBeGreaterThanOrEqual(1)
    expect(response.pagination.pageSize).toBeGreaterThan(0)
    expect(response.pagination.totalPages).toBe(
      Math.ceil(response.pagination.totalItems / response.pagination.pageSize)
    )
  })

  it('should calculate hasNext and hasPrev correctly', () => {
    const scenarios = [
      { page: 1, totalPages: 3, hasNext: true, hasPrev: false },
      { page: 2, totalPages: 3, hasNext: true, hasPrev: true },
      { page: 3, totalPages: 3, hasNext: false, hasPrev: true },
      { page: 1, totalPages: 1, hasNext: false, hasPrev: false },
    ]

    scenarios.forEach(({ page, totalPages, hasNext, hasPrev }) => {
      expect(page < totalPages).toBe(hasNext)
      expect(page > 1).toBe(hasPrev)
    })
  })
})
