import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubmitQuizAnswerUseCase, SubmitQuizAnswerInput } from './submit-quiz-answer'
import type { IQuizAttemptRepository } from '../repositories/quiz-repository'
import type { ILearningRecordRepository } from '../repositories/learning-record-repository'
import type { QuizAttempt, LearningRecord } from '../entities/translation'

describe('SubmitQuizAnswerUseCase', () => {
  let useCase: SubmitQuizAnswerUseCase
  let mockQuizRepo: IQuizAttemptRepository
  let mockRecordRepo: ILearningRecordRepository

  const mockLearningRecord: LearningRecord = {
    id: 'record-1',
    userId: 'user-1',
    koreanInput: '밥 뭐 먹을래?',
    englishExpression: 'What do you want to eat?',
    contextExplanation: '식사 시간에 물어볼 때',
    alternatives: [],
    relatedVocabulary: [],
    category: '음식',
    isBookmarked: false,
    masteryLevel: 2,
    reviewCount: 5,
    nextReviewAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockQuizAttempt: QuizAttempt = {
    id: 'attempt-1',
    userId: 'user-1',
    recordId: 'record-1',
    quizType: 'korean_to_english',
    question: '밥 뭐 먹을래?',
    userAnswer: 'What do you want to eat?',
    correctAnswer: 'What do you want to eat?',
    isCorrect: true,
    timeTakenMs: 5000,
    createdAt: new Date(),
  }

  beforeEach(() => {
    mockQuizRepo = {
      create: vi.fn().mockResolvedValue(mockQuizAttempt),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByRecordId: vi.fn(),
      getStats: vi.fn(),
      getStatsForRecord: vi.fn(),
      delete: vi.fn(),
    }

    mockRecordRepo = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockLearningRecord),
      findByUserId: vi.fn(),
      findDueForReview: vi.fn(),
      update: vi.fn().mockImplementation((id, data) => ({
        ...mockLearningRecord,
        ...data,
      })),
      updateMasteryLevel: vi.fn(),
      toggleBookmark: vi.fn(),
      delete: vi.fn(),
    }

    useCase = new SubmitQuizAnswerUseCase(mockQuizRepo, mockRecordRepo)
  })

  describe('execute()', () => {
    it('should grade correct answer and save quiz attempt', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      const result = await useCase.execute(input)

      expect(mockQuizRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        isCorrect: true,
        timeTakenMs: 5000,
      })

      expect(result.quizResult.isCorrect).toBe(true)
      expect(result.quizAttempt).toEqual(mockQuizAttempt)
    })

    it('should increase mastery level on correct answer', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      const result = await useCase.execute(input)

      expect(mockRecordRepo.update).toHaveBeenCalledWith('record-1', expect.objectContaining({
        masteryLevel: 3, // 2 -> 3
        reviewCount: 6, // 5 -> 6
      }))

      expect(result.updatedRecord.masteryLevel).toBe(3)
    })

    it('should decrease mastery level on incorrect answer', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'Hello world',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      // 오답 처리된 QuizAttempt
      mockQuizRepo.create = vi.fn().mockResolvedValue({
        ...mockQuizAttempt,
        userAnswer: 'Hello world',
        isCorrect: false,
      })

      const result = await useCase.execute(input)

      expect(result.quizResult.isCorrect).toBe(false)
      expect(mockRecordRepo.update).toHaveBeenCalledWith('record-1', expect.objectContaining({
        masteryLevel: 1, // 2 -> 1
      }))
    })

    it('should not decrease mastery level below 0', async () => {
      // 숙달도가 0인 레코드
      mockRecordRepo.findById = vi.fn().mockResolvedValue({
        ...mockLearningRecord,
        masteryLevel: 0,
      })

      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'wrong',
        correctAnswer: 'correct',
        timeTakenMs: 5000,
      }

      await useCase.execute(input)

      expect(mockRecordRepo.update).toHaveBeenCalledWith('record-1', expect.objectContaining({
        masteryLevel: 0, // 최소값 유지
      }))
    })

    it('should not increase mastery level above 5', async () => {
      // 숙달도가 5인 레코드
      mockRecordRepo.findById = vi.fn().mockResolvedValue({
        ...mockLearningRecord,
        masteryLevel: 5,
      })

      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'correct',
        correctAnswer: 'correct',
        timeTakenMs: 5000,
      }

      await useCase.execute(input)

      expect(mockRecordRepo.update).toHaveBeenCalledWith('record-1', expect.objectContaining({
        masteryLevel: 5, // 최대값 유지
      }))
    })

    it('should update review count', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      await useCase.execute(input)

      expect(mockRecordRepo.update).toHaveBeenCalledWith('record-1', expect.objectContaining({
        reviewCount: 6, // 5 -> 6
      }))
    })

    it('should set next review date based on mastery level', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      await useCase.execute(input)

      expect(mockRecordRepo.update).toHaveBeenCalledWith('record-1', expect.objectContaining({
        nextReviewAt: expect.any(Date),
      }))
    })

    it('should throw error if record not found', async () => {
      mockRecordRepo.findById = vi.fn().mockResolvedValue(null)

      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'non-existent',
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'test',
        correctAnswer: 'test',
        timeTakenMs: 5000,
      }

      await expect(useCase.execute(input)).rejects.toThrow('Learning record not found')
    })

    it('should handle multiple choice quiz type', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'multiple_choice',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 2000,
      }

      const result = await useCase.execute(input)

      expect(result.quizResult.isCorrect).toBe(true)
      expect(mockQuizRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        quizType: 'multiple_choice',
      }))
    })

    it('should handle fill blank quiz type', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'fill_blank',
        question: '"What do you _____ to eat?"',
        userAnswer: 'want',
        correctAnswer: 'want',
        timeTakenMs: 3000,
      }

      const result = await useCase.execute(input)

      expect(result.quizResult.isCorrect).toBe(true)
      expect(mockQuizRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        quizType: 'fill_blank',
      }))
    })
  })

  describe('grading accuracy', () => {
    it('should accept answers with minor typos (90%+ similarity)', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eatt?', // 오타
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      const result = await useCase.execute(input)

      // 90% 이상 유사도면 정답 처리
      expect(result.quizResult.isCorrect).toBe(true)
    })

    it('should be case insensitive', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'WHAT DO YOU WANT TO EAT?',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      const result = await useCase.execute(input)

      expect(result.quizResult.isCorrect).toBe(true)
    })

    it('should ignore punctuation differences', async () => {
      const input: SubmitQuizAnswerInput = {
        userId: 'user-1',
        recordId: 'record-1',
        quizType: 'korean_to_english',
        question: '밥 뭐 먹을래?',
        userAnswer: 'What do you want to eat',
        correctAnswer: 'What do you want to eat?',
        timeTakenMs: 5000,
      }

      const result = await useCase.execute(input)

      expect(result.quizResult.isCorrect).toBe(true)
    })
  })
})
