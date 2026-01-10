import { describe, it, expect } from 'vitest'
import { QuizGenerator, QuizGrader, QuizSubmission } from './quiz-generator'
import type { LearningRecord } from '../entities/translation'

/**
 * 학습 흐름 통합 테스트
 *
 * 실제 사용자의 학습 시나리오를 시뮬레이션하여
 * 전체 시스템이 올바르게 동작하는지 검증
 */

// 복습 간격 (일)
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60]

/**
 * 숙달도 업데이트 시뮬레이션
 */
function updateMastery(
  current: number,
  isCorrect: boolean
): { newLevel: number; nextReviewDays: number } {
  const newLevel = isCorrect
    ? Math.min(current + 1, 5)
    : Math.max(current - 1, 0)

  return {
    newLevel,
    nextReviewDays: REVIEW_INTERVALS[newLevel],
  }
}

describe('Complete Learning Flow Simulation', () => {
  const generator = new QuizGenerator()
  const grader = new QuizGrader()

  describe('New Learner Journey', () => {
    it('should simulate a new user learning their first expression', () => {
      // 1단계: 새 표현 학습
      const record: LearningRecord = {
        id: 'first-expression',
        userId: 'new-user',
        koreanInput: '안녕하세요',
        englishExpression: 'Hello',
        contextExplanation: '기본 인사',
        alternatives: [
          { expression: 'Hi', situation: 'casual', difference: '더 캐주얼' },
        ],
        relatedVocabulary: [],
        category: '일상대화',
        isBookmarked: false,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // 2단계: 첫 퀴즈 생성 (숙달도 0이면 객관식)
      const quiz = generator.generateRandomQuiz(record, [])
      expect(quiz.type).toBe('multiple_choice')

      // 3단계: 정답 제출
      const submission: QuizSubmission = {
        quizType: quiz.type,
        question: quiz.question,
        userAnswer: quiz.correctAnswer,
        correctAnswer: quiz.correctAnswer,
        recordId: quiz.recordId,
        timeTakenMs: 5000,
      }

      const result = grader.grade(submission)
      expect(result.isCorrect).toBe(true)

      // 4단계: 숙달도 업데이트
      const mastery = updateMastery(record.masteryLevel, result.isCorrect)
      expect(mastery.newLevel).toBe(1)
      expect(mastery.nextReviewDays).toBe(3) // 레벨 1: 3일 후 복습
    })

    it('should progress through mastery levels with correct answers', () => {
      let masteryLevel = 0

      // 0 → 1 → 2 → 3 → 4 → 5 진행
      for (let i = 0; i < 5; i++) {
        const result = updateMastery(masteryLevel, true)
        masteryLevel = result.newLevel
      }

      expect(masteryLevel).toBe(5)
    })

    it('should decrease mastery on wrong answer', () => {
      let masteryLevel = 3

      // 오답: 3 → 2
      const result = updateMastery(masteryLevel, false)
      expect(result.newLevel).toBe(2)
      expect(result.nextReviewDays).toBe(7) // 레벨 2: 7일 후
    })

    it('should not go below mastery level 0', () => {
      const result = updateMastery(0, false)
      expect(result.newLevel).toBe(0)
    })

    it('should not go above mastery level 5', () => {
      const result = updateMastery(5, true)
      expect(result.newLevel).toBe(5)
    })
  })

  describe('Quiz Type Progression', () => {
    const createRecordWithMastery = (masteryLevel: number): LearningRecord => ({
      id: 'test',
      userId: 'user',
      koreanInput: '오늘 뭐 할 거야?',
      englishExpression: 'What are you doing today?',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel,
      reviewCount: 0,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    it('should use multiple_choice for mastery 0-1', () => {
      const record0 = createRecordWithMastery(0)
      const record1 = createRecordWithMastery(1)

      expect(generator.generateRandomQuiz(record0, []).type).toBe('multiple_choice')
      expect(generator.generateRandomQuiz(record1, []).type).toBe('multiple_choice')
    })

    it('should use fill_blank for mastery 2-3', () => {
      const record2 = createRecordWithMastery(2)
      const record3 = createRecordWithMastery(3)

      const quiz2 = generator.generateRandomQuiz(record2, [])
      const quiz3 = generator.generateRandomQuiz(record3, [])

      // fill_blank 또는 fallback인 korean_to_english
      expect(['fill_blank', 'korean_to_english']).toContain(quiz2.type)
      expect(['fill_blank', 'korean_to_english']).toContain(quiz3.type)
    })

    it('should use korean_to_english for mastery 4-5', () => {
      const record4 = createRecordWithMastery(4)
      const record5 = createRecordWithMastery(5)

      expect(generator.generateRandomQuiz(record4, []).type).toBe('korean_to_english')
      expect(generator.generateRandomQuiz(record5, []).type).toBe('korean_to_english')
    })
  })

  describe('Full Session Simulation', () => {
    it('should simulate a complete quiz session with 5 questions', () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          userId: 'user',
          koreanInput: '안녕',
          englishExpression: 'Hello',
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 0,
          reviewCount: 0,
          nextReviewAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 'user',
          koreanInput: '잘가',
          englishExpression: 'Goodbye',
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 1,
          reviewCount: 1,
          nextReviewAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          userId: 'user',
          koreanInput: '감사합니다',
          englishExpression: 'Thank you very much',
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 2,
          reviewCount: 3,
          nextReviewAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          userId: 'user',
          koreanInput: '죄송합니다',
          englishExpression: "I'm sorry",
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 3,
          reviewCount: 5,
          nextReviewAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '5',
          userId: 'user',
          koreanInput: '실례합니다',
          englishExpression: 'Excuse me',
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 4,
          reviewCount: 8,
          nextReviewAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const sessionResults: {
        recordId: string
        quizType: string
        isCorrect: boolean
        newMastery: number
      }[] = []

      // 각 레코드에 대해 퀴즈 생성 및 답변
      records.forEach((record) => {
        const quiz = generator.generateRandomQuiz(record, records)

        // 정답 제출 시뮬레이션
        const submission: QuizSubmission = {
          quizType: quiz.type,
          question: quiz.question,
          userAnswer: quiz.correctAnswer, // 모두 정답
          correctAnswer: quiz.correctAnswer,
          recordId: quiz.recordId,
          timeTakenMs: Math.random() * 10000,
        }

        const result = grader.grade(submission)
        const mastery = updateMastery(record.masteryLevel, result.isCorrect)

        sessionResults.push({
          recordId: record.id,
          quizType: quiz.type,
          isCorrect: result.isCorrect,
          newMastery: mastery.newLevel,
        })
      })

      // 결과 검증
      expect(sessionResults).toHaveLength(5)
      sessionResults.forEach((result) => {
        expect(result.isCorrect).toBe(true)
      })

      // 모든 숙달도가 증가했는지 확인
      expect(sessionResults[0].newMastery).toBe(1) // 0 → 1
      expect(sessionResults[1].newMastery).toBe(2) // 1 → 2
      expect(sessionResults[2].newMastery).toBe(3) // 2 → 3
      expect(sessionResults[3].newMastery).toBe(4) // 3 → 4
      expect(sessionResults[4].newMastery).toBe(5) // 4 → 5
    })

    it('should calculate session statistics', () => {
      const results = [
        { isCorrect: true, timeTakenMs: 5000 },
        { isCorrect: true, timeTakenMs: 3000 },
        { isCorrect: false, timeTakenMs: 8000 },
        { isCorrect: true, timeTakenMs: 4000 },
        { isCorrect: false, timeTakenMs: 6000 },
      ]

      const correctCount = results.filter((r) => r.isCorrect).length
      const accuracy = correctCount / results.length
      const totalTime = results.reduce((sum, r) => sum + r.timeTakenMs, 0)
      const avgTime = totalTime / results.length

      expect(correctCount).toBe(3)
      expect(accuracy).toBe(0.6) // 60%
      expect(totalTime).toBe(26000)
      expect(avgTime).toBe(5200)
    })
  })

  describe('Spaced Repetition Intervals', () => {
    it('should have correct review intervals for each mastery level', () => {
      expect(REVIEW_INTERVALS[0]).toBe(1) // 1일
      expect(REVIEW_INTERVALS[1]).toBe(3) // 3일
      expect(REVIEW_INTERVALS[2]).toBe(7) // 1주
      expect(REVIEW_INTERVALS[3]).toBe(14) // 2주
      expect(REVIEW_INTERVALS[4]).toBe(30) // 1개월
      expect(REVIEW_INTERVALS[5]).toBe(60) // 2개월
    })

    it('should calculate next review date correctly', () => {
      const now = new Date()
      const masteryLevel = 2

      const nextReviewDays = REVIEW_INTERVALS[masteryLevel]
      const nextReviewDate = new Date(now.getTime() + nextReviewDays * 24 * 60 * 60 * 1000)

      // 7일 후
      const daysDiff = Math.round(
        (nextReviewDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      expect(daysDiff).toBe(7)
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('should handle user making mistakes and recovering', () => {
      let masteryLevel = 3

      // 실수: 3 → 2
      masteryLevel = updateMastery(masteryLevel, false).newLevel
      expect(masteryLevel).toBe(2)

      // 복구: 2 → 3
      masteryLevel = updateMastery(masteryLevel, true).newLevel
      expect(masteryLevel).toBe(3)

      // 연속 정답: 3 → 4 → 5
      masteryLevel = updateMastery(masteryLevel, true).newLevel
      expect(masteryLevel).toBe(4)
      masteryLevel = updateMastery(masteryLevel, true).newLevel
      expect(masteryLevel).toBe(5)
    })

    it('should handle multiple consecutive wrong answers', () => {
      let masteryLevel = 4

      // 연속 오답: 4 → 3 → 2 → 1 → 0 → 0
      for (let i = 0; i < 6; i++) {
        masteryLevel = updateMastery(masteryLevel, false).newLevel
      }

      expect(masteryLevel).toBe(0) // 0 아래로 내려가지 않음
    })
  })
})

describe('Category-based Learning', () => {
  const generator = new QuizGenerator()

  describe('Cross-category quiz generation', () => {
    it('should generate quiz with options from same category', () => {
      const record: LearningRecord = {
        id: '1',
        userId: 'user',
        koreanInput: '아기 재워야 해',
        englishExpression: 'I need to put the baby to sleep',
        contextExplanation: '',
        alternatives: [],
        relatedVocabulary: [],
        category: '육아',
        isBookmarked: false,
        masteryLevel: 0,
        reviewCount: 0,
        nextReviewAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const sameCategoryRecords = [
        { ...record, id: '2', englishExpression: 'Time to change the diaper' },
        { ...record, id: '3', englishExpression: "Let's feed the baby" },
        { ...record, id: '4', englishExpression: 'The baby is crying' },
      ]

      const differentCategoryRecords = [
        { ...record, id: '5', category: '비즈니스', englishExpression: 'Please review the report' },
        { ...record, id: '6', category: '비즈니스', englishExpression: 'Schedule a meeting' },
      ]

      const quiz = generator.generateMultipleChoice(record, [
        ...sameCategoryRecords,
        ...differentCategoryRecords,
      ])

      // 같은 카테고리 옵션이 우선적으로 포함되어야 함
      const hasSameCategoryOption = quiz.options!.some(
        (opt) =>
          opt === 'Time to change the diaper' ||
          opt === "Let's feed the baby" ||
          opt === 'The baby is crying'
      )
      expect(hasSameCategoryOption).toBe(true)
    })
  })
})

describe('Typo Handling in Real Scenarios', () => {
  const grader = new QuizGrader()

  describe('Common typing mistakes', () => {
    const typoScenarios = [
      {
        correct: 'Have you eaten?',
        typo: 'Have you eatne?',
        description: 'transposed letters (close but below 90%)',
        shouldPass: false, // 14 chars, 2 transposed = ~86% similarity
      },
      {
        correct: 'What do you want to eat?',
        typo: 'What do you want to eat',
        description: 'missing punctuation',
        shouldPass: true,
      },
      {
        correct: "I'm going home",
        typo: 'Im going home',
        description: 'missing apostrophe',
        shouldPass: true,
      },
      {
        correct: 'Thank you very much',
        typo: 'Thank you very mush',
        description: 'similar sounding typo',
        shouldPass: true,
      },
      {
        correct: 'Goodbye',
        typo: 'Goodby',
        description: 'missing final letter',
        shouldPass: false, // 짧은 단어에서 한 글자 = 낮은 유사도
      },
    ]

    typoScenarios.forEach(({ correct, typo, description, shouldPass }) => {
      it(`should ${shouldPass ? 'accept' : 'reject'} ${description}: "${typo}"`, () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '테스트',
          userAnswer: typo,
          correctAnswer: correct,
          recordId: 'test',
          timeTakenMs: 5000,
        }

        const result = grader.grade(submission)
        expect(result.isCorrect).toBe(shouldPass)
      })
    })
  })
})

describe('Performance Under Load', () => {
  const generator = new QuizGenerator()
  const grader = new QuizGrader()

  it('should generate 100 quizzes quickly', () => {
    const record: LearningRecord = {
      id: 'perf-test',
      userId: 'user',
      koreanInput: '테스트',
      englishExpression: 'This is a performance test expression',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [],
      category: '테스트',
      isBookmarked: false,
      masteryLevel: 2,
      reviewCount: 0,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const start = Date.now()
    for (let i = 0; i < 100; i++) {
      generator.generateRandomQuiz(record, [])
    }
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(100) // 100ms 미만
  })

  it('should grade 100 submissions quickly', () => {
    const submissions: QuizSubmission[] = Array.from({ length: 100 }, (_, i) => ({
      quizType: 'korean_to_english' as const,
      question: `Question ${i}`,
      userAnswer: `Answer ${i}`,
      correctAnswer: `Answer ${i}`,
      recordId: `record-${i}`,
      timeTakenMs: 1000,
    }))

    const start = Date.now()
    submissions.forEach((s) => grader.grade(s))
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(50) // 50ms 미만
  })
})
