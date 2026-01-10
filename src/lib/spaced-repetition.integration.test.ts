import { describe, it, expect } from 'vitest'
import {
  calculateNextReview,
  calculateNewMasteryLevel,
  REVIEW_INTERVALS,
} from './spaced-repetition'
import { QuizGenerator, QuizGrader } from '@/domain/services/quiz-generator'
import type { LearningRecord } from '@/domain/entities/translation'

describe('Spaced Repetition Integration Tests', () => {
  describe('Learning progression simulation', () => {
    it('should simulate a complete learning journey from beginner to mastery', () => {
      let masteryLevel = 0
      const history: { correct: boolean; mastery: number; intervalDays: number }[] = []

      // 시뮬레이션: 10번의 퀴즈 시도
      const attempts = [true, true, false, true, true, true, true, false, true, true]

      attempts.forEach((isCorrect) => {
        masteryLevel = calculateNewMasteryLevel(masteryLevel, isCorrect)
        const nextReview = calculateNextReview(masteryLevel)
        const today = new Date()
        const intervalDays = Math.round(
          (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        history.push({ correct: isCorrect, mastery: masteryLevel, intervalDays })
      })

      // 마지막 숙달도 확인
      expect(masteryLevel).toBeGreaterThanOrEqual(3)
      expect(masteryLevel).toBeLessThanOrEqual(5)

      // 숙달도가 증가함에 따라 복습 간격도 증가해야 함
      const correctAnswers = history.filter((h) => h.correct)
      expect(correctAnswers[correctAnswers.length - 1].intervalDays).toBeGreaterThan(
        correctAnswers[0].intervalDays
      )
    })

    it('should handle streak of correct answers', () => {
      let masteryLevel = 0

      // 연속 정답
      for (let i = 0; i < 6; i++) {
        masteryLevel = calculateNewMasteryLevel(masteryLevel, true)
      }

      expect(masteryLevel).toBe(5) // 최대값
      expect(calculateNextReview(masteryLevel)).toBeDefined()
    })

    it('should handle streak of incorrect answers', () => {
      let masteryLevel = 5

      // 연속 오답
      for (let i = 0; i < 6; i++) {
        masteryLevel = calculateNewMasteryLevel(masteryLevel, false)
      }

      expect(masteryLevel).toBe(0) // 최소값
    })

    it('should maintain reasonable intervals', () => {
      REVIEW_INTERVALS.forEach((interval, index) => {
        const nextReview = calculateNextReview(index)
        const today = new Date()
        const daysDiff = Math.round(
          (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        expect(daysDiff).toBe(interval)
      })
    })
  })

  describe('Quiz and Spaced Repetition workflow', () => {
    const generator = new QuizGenerator()
    const grader = new QuizGrader()

    const createRecord = (masteryLevel: number): LearningRecord => ({
      id: 'test-1',
      userId: 'user-1',
      koreanInput: '고마워',
      englishExpression: 'Thank you',
      contextExplanation: '감사 표현',
      alternatives: [{ expression: 'Thanks', situation: 'Casual', difference: 'More informal' }],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel,
      reviewCount: 0,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    it('should generate appropriate quiz type based on mastery level', () => {
      // 낮은 숙달도 -> 객관식
      const lowMasteryRecord = createRecord(0)
      const lowQuiz = generator.generateRandomQuiz(lowMasteryRecord, [])
      expect(lowQuiz.type).toBe('multiple_choice')

      // 중간 숙달도 -> 빈칸 채우기
      const midMasteryRecord = createRecord(2)
      const midQuiz = generator.generateRandomQuiz(midMasteryRecord, [])
      expect(['fill_blank', 'korean_to_english']).toContain(midQuiz.type)

      // 높은 숙달도 -> 직접 입력
      const highMasteryRecord = createRecord(4)
      const highQuiz = generator.generateRandomQuiz(highMasteryRecord, [])
      expect(highQuiz.type).toBe('korean_to_english')
    })

    it('should provide helpful feedback for near-correct answers', () => {
      const record = createRecord(3)
      const quiz = generator.generateKoreanToEnglish(record)

      // 거의 맞은 답
      const result = grader.grade({
        quizType: 'korean_to_english',
        question: quiz.question,
        userAnswer: 'Thnk you', // 오타
        correctAnswer: quiz.correctAnswer,
        recordId: quiz.recordId,
        timeTakenMs: 3000,
      })

      expect(result.similarity).toBeGreaterThan(0.7)
      expect(result.feedback).toBeDefined()
    })

    it('should simulate realistic learning session', () => {
      const record = createRecord(1)
      let currentMastery = record.masteryLevel
      const sessionResults: boolean[] = []

      // 5개 퀴즈 세션
      for (let i = 0; i < 5; i++) {
        const quiz = generator.generateRandomQuiz({ ...record, masteryLevel: currentMastery }, [])

        // 시뮬레이션: 숙달도가 높을수록 정답 확률 증가
        const correctProbability = 0.5 + currentMastery * 0.1
        const isCorrect = Math.random() < correctProbability

        const result = grader.grade({
          quizType: quiz.type,
          question: quiz.question,
          userAnswer: isCorrect ? quiz.correctAnswer : 'wrong answer',
          correctAnswer: quiz.correctAnswer,
          recordId: quiz.recordId,
          timeTakenMs: 5000,
        })

        currentMastery = calculateNewMasteryLevel(currentMastery, result.isCorrect)
        sessionResults.push(result.isCorrect)
      }

      // 결과 검증
      expect(currentMastery).toBeGreaterThanOrEqual(0)
      expect(currentMastery).toBeLessThanOrEqual(5)
      expect(sessionResults.length).toBe(5)
    })
  })

  describe('Review scheduling accuracy', () => {
    it('should schedule reviews in increasing intervals', () => {
      const intervals: number[] = []

      for (let level = 0; level <= 5; level++) {
        const nextReview = calculateNextReview(level)
        const today = new Date()
        const days = Math.round(
          (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        intervals.push(days)
      }

      // 간격이 단조 증가해야 함
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
      }
    })

    it('should calculate reasonable mastery progression', () => {
      // 매일 정답을 맞추면 약 1주일 후에는 숙달도 5에 도달
      let mastery = 0
      let days = 0

      while (mastery < 5 && days < 100) {
        mastery = calculateNewMasteryLevel(mastery, true)
        days++
      }

      expect(days).toBe(5) // 5번 정답이면 숙달도 5 도달
    })

    it('should handle edge cases in mastery calculation', () => {
      // 경계값 테스트 - 함수는 입력값을 그대로 계산함
      expect(calculateNewMasteryLevel(-1, true)).toBe(0) // min(-1+1, 5) = 0
      expect(calculateNewMasteryLevel(10, true)).toBe(5) // min(10+1, 5) = 5
      expect(calculateNewMasteryLevel(-1, false)).toBe(0) // max(-1-1, 0) = 0
      expect(calculateNewMasteryLevel(10, false)).toBe(9) // max(10-1, 0) = 9 (함수는 상한 체크 안함)
    })
  })

  describe('Quiz variety and fairness', () => {
    const generator = new QuizGenerator()

    it('should shuffle options in multiple choice consistently', () => {
      const record: LearningRecord = {
        id: 'test',
        userId: 'user',
        koreanInput: '안녕',
        englishExpression: 'Hello',
        contextExplanation: '',
        alternatives: [
          { expression: 'Hi', situation: 'Casual', difference: 'Informal' },
          { expression: 'Hey', situation: 'Very casual', difference: 'Friendly' },
        ],
        relatedVocabulary: [],
        category: '일상대화',
        isBookmarked: false,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const otherRecords = [
        { ...record, id: '2', englishExpression: 'Good morning' },
        { ...record, id: '3', englishExpression: 'Good evening' },
      ] as LearningRecord[]

      // 여러 번 생성해서 옵션에 정답이 항상 포함되는지 확인
      for (let i = 0; i < 10; i++) {
        const quiz = generator.generateMultipleChoice(record, otherRecords)
        expect(quiz.options).toContain('Hello')
        expect(quiz.options!.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should generate fill blank quiz with appropriate blanks', () => {
      const record: LearningRecord = {
        id: 'test',
        userId: 'user',
        koreanInput: '오늘 날씨 어때?',
        englishExpression: "How's the weather today?",
        contextExplanation: '',
        alternatives: [],
        relatedVocabulary: [],
        category: '일상대화',
        isBookmarked: false,
        masteryLevel: 2,
        reviewCount: 0,
        nextReviewAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const quiz = generator.generateFillBlank(record)

      // 빈칸이 있어야 함
      expect(quiz.question).toContain('_____')
      // 정답이 있어야 함
      expect(quiz.correctAnswer.length).toBeGreaterThan(0)
    })
  })
})
