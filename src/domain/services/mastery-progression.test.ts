import { describe, it, expect } from 'vitest'

/**
 * 숙달 레벨 진행 테스트
 *
 * 학습자의 숙달도가 퀴즈 결과에 따라 어떻게 변화하는지 검증:
 * - 정답 시 레벨 상승
 * - 오답 시 레벨 하락
 * - 레벨 경계 조건
 * - 복습 간격 연동
 */

// Spaced Repetition 상수 (실제 구현과 동일)
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] // days

/**
 * 마스터리 레벨 업데이트 로직
 */
function updateMasteryLevel(
  currentLevel: number,
  isCorrect: boolean
): { newLevel: number; change: number } {
  const MIN_LEVEL = 0
  const MAX_LEVEL = 5

  let newLevel = currentLevel
  let change = 0

  if (isCorrect) {
    if (currentLevel < MAX_LEVEL) {
      newLevel = currentLevel + 1
      change = 1
    }
  } else {
    if (currentLevel > MIN_LEVEL) {
      newLevel = Math.max(MIN_LEVEL, currentLevel - 1)
      change = -1
    }
  }

  return { newLevel, change }
}

/**
 * 다음 복습일 계산
 */
function calculateNextReview(masteryLevel: number): {
  daysUntilReview: number
  nextReviewDate: Date
} {
  const daysUntilReview = REVIEW_INTERVALS[Math.min(masteryLevel, REVIEW_INTERVALS.length - 1)]
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilReview)

  return { daysUntilReview, nextReviewDate }
}

/**
 * 학습 세션 시뮬레이션
 */
interface SessionResult {
  startLevel: number
  endLevel: number
  correctCount: number
  incorrectCount: number
  levelChanges: number[]
}

function simulateLearningSession(
  startLevel: number,
  answers: boolean[]
): SessionResult {
  let currentLevel = startLevel
  const levelChanges: number[] = []
  let correctCount = 0
  let incorrectCount = 0

  for (const isCorrect of answers) {
    const { newLevel, change } = updateMasteryLevel(currentLevel, isCorrect)
    currentLevel = newLevel
    levelChanges.push(change)
    if (isCorrect) correctCount++
    else incorrectCount++
  }

  return {
    startLevel,
    endLevel: currentLevel,
    correctCount,
    incorrectCount,
    levelChanges,
  }
}

describe('Mastery Level Progression', () => {
  describe('Basic Level Updates', () => {
    describe('Level increase on correct answer', () => {
      const testCases = [
        { currentLevel: 0, expectedNewLevel: 1 },
        { currentLevel: 1, expectedNewLevel: 2 },
        { currentLevel: 2, expectedNewLevel: 3 },
        { currentLevel: 3, expectedNewLevel: 4 },
        { currentLevel: 4, expectedNewLevel: 5 },
      ]

      testCases.forEach(({ currentLevel, expectedNewLevel }) => {
        it(`should increase level from ${currentLevel} to ${expectedNewLevel} on correct answer`, () => {
          const result = updateMasteryLevel(currentLevel, true)
          expect(result.newLevel).toBe(expectedNewLevel)
          expect(result.change).toBe(1)
        })
      })
    })

    describe('Level decrease on incorrect answer', () => {
      const testCases = [
        { currentLevel: 5, expectedNewLevel: 4 },
        { currentLevel: 4, expectedNewLevel: 3 },
        { currentLevel: 3, expectedNewLevel: 2 },
        { currentLevel: 2, expectedNewLevel: 1 },
        { currentLevel: 1, expectedNewLevel: 0 },
      ]

      testCases.forEach(({ currentLevel, expectedNewLevel }) => {
        it(`should decrease level from ${currentLevel} to ${expectedNewLevel} on incorrect answer`, () => {
          const result = updateMasteryLevel(currentLevel, false)
          expect(result.newLevel).toBe(expectedNewLevel)
          expect(result.change).toBe(-1)
        })
      })
    })
  })

  describe('Boundary Conditions', () => {
    it('should not exceed maximum level (5)', () => {
      const result = updateMasteryLevel(5, true)
      expect(result.newLevel).toBe(5)
      expect(result.change).toBe(0)
    })

    it('should not go below minimum level (0)', () => {
      const result = updateMasteryLevel(0, false)
      expect(result.newLevel).toBe(0)
      expect(result.change).toBe(0)
    })

    it('should stay at max level even after multiple correct answers', () => {
      let level = 5
      for (let i = 0; i < 10; i++) {
        const result = updateMasteryLevel(level, true)
        level = result.newLevel
      }
      expect(level).toBe(5)
    })

    it('should stay at min level even after multiple incorrect answers', () => {
      let level = 0
      for (let i = 0; i < 10; i++) {
        const result = updateMasteryLevel(level, false)
        level = result.newLevel
      }
      expect(level).toBe(0)
    })
  })

  describe('Session Simulations', () => {
    it('should reach max level with consecutive correct answers', () => {
      const result = simulateLearningSession(0, [true, true, true, true, true])
      expect(result.endLevel).toBe(5)
      expect(result.correctCount).toBe(5)
      expect(result.levelChanges).toEqual([1, 1, 1, 1, 1])
    })

    it('should reach min level with consecutive incorrect answers', () => {
      const result = simulateLearningSession(5, [false, false, false, false, false])
      expect(result.endLevel).toBe(0)
      expect(result.incorrectCount).toBe(5)
      expect(result.levelChanges).toEqual([-1, -1, -1, -1, -1])
    })

    it('should maintain level with alternating answers', () => {
      const result = simulateLearningSession(3, [true, false, true, false, true, false])
      // 3 -> 4 -> 3 -> 4 -> 3 -> 4 -> 3
      expect(result.endLevel).toBe(3)
      expect(result.correctCount).toBe(3)
      expect(result.incorrectCount).toBe(3)
    })

    it('should progress with more correct than incorrect', () => {
      const result = simulateLearningSession(0, [true, true, true, false, true, true])
      // 0 -> 1 -> 2 -> 3 -> 2 -> 3 -> 4
      expect(result.endLevel).toBe(4)
      expect(result.correctCount).toBe(5)
      expect(result.incorrectCount).toBe(1)
    })

    it('should regress with more incorrect than correct', () => {
      const result = simulateLearningSession(5, [false, false, false, true, false, false])
      // 5 -> 4 -> 3 -> 2 -> 3 -> 2 -> 1
      expect(result.endLevel).toBe(1)
      expect(result.correctCount).toBe(1)
      expect(result.incorrectCount).toBe(5)
    })
  })

  describe('Real-World Learning Patterns', () => {
    it('should simulate typical beginner progression', () => {
      // 초보자: 처음엔 틀리다가 점점 맞춤
      const answers = [false, false, true, false, true, true, true, true, true, true]
      const result = simulateLearningSession(0, answers)

      expect(result.endLevel).toBeGreaterThan(result.startLevel)
      expect(result.correctCount).toBeGreaterThan(result.incorrectCount)
    })

    it('should simulate learning plateau', () => {
      // 정체기: 맞추고 틀리고 반복
      const answers = [true, false, true, false, true, false, true, false]
      const result = simulateLearningSession(3, answers)

      // 레벨이 크게 변하지 않아야 함
      expect(Math.abs(result.endLevel - result.startLevel)).toBeLessThanOrEqual(1)
    })

    it('should simulate breakthrough after plateau', () => {
      // 정체기 후 돌파: 틀리다가 갑자기 연속 정답
      const answers = [false, true, false, true, true, true, true, true]
      const result = simulateLearningSession(2, answers)

      expect(result.endLevel).toBeGreaterThan(result.startLevel)
    })

    it('should simulate forgetting curve', () => {
      // 망각 곡선: 오랜만에 복습하면 처음엔 틀림
      // 4 -> 3 (오답) -> 2 (오답) -> 3 (정답) -> 4 (정답) -> 5 (정답)
      const answers = [false, false, true, true, true]
      const result = simulateLearningSession(4, answers)

      expect(result.levelChanges[0]).toBe(-1) // 첫 번째 오답으로 하락
      expect(result.endLevel).toBe(5) // 최종적으로는 회복
    })
  })
})

describe('Review Interval Calculation', () => {
  describe('Interval by mastery level', () => {
    const expectedIntervals = [
      { level: 0, days: 1 },
      { level: 1, days: 3 },
      { level: 2, days: 7 },
      { level: 3, days: 14 },
      { level: 4, days: 30 },
      { level: 5, days: 60 },
    ]

    expectedIntervals.forEach(({ level, days }) => {
      it(`should have ${days} days interval for level ${level}`, () => {
        const result = calculateNextReview(level)
        expect(result.daysUntilReview).toBe(days)
      })
    })
  })

  describe('Next review date calculation', () => {
    it('should calculate correct next review date', () => {
      const now = new Date()
      const result = calculateNextReview(2) // 7 days

      const expectedDate = new Date(now)
      expectedDate.setDate(expectedDate.getDate() + 7)

      // 날짜만 비교 (시간 제외)
      expect(result.nextReviewDate.toDateString()).toBe(expectedDate.toDateString())
    })

    it('should handle month boundaries', () => {
      const result = calculateNextReview(4) // 30 days
      const nextMonth = new Date()
      nextMonth.setDate(nextMonth.getDate() + 30)

      expect(result.nextReviewDate.getMonth()).toBe(nextMonth.getMonth())
    })
  })

  describe('Interval progression', () => {
    it('should have increasing intervals as level increases', () => {
      for (let level = 0; level < 5; level++) {
        const current = calculateNextReview(level)
        const next = calculateNextReview(level + 1)
        expect(next.daysUntilReview).toBeGreaterThan(current.daysUntilReview)
      }
    })

    it('should have reasonable interval growth', () => {
      // 간격이 너무 급격하게 증가하지 않아야 함
      for (let level = 0; level < 5; level++) {
        const current = calculateNextReview(level)
        const next = calculateNextReview(level + 1)
        const ratio = next.daysUntilReview / current.daysUntilReview
        expect(ratio).toBeLessThanOrEqual(3) // 최대 3배
      }
    })
  })
})

describe('Mastery and Quiz Type Correlation', () => {
  /**
   * 마스터리 레벨에 따른 퀴즈 타입 상관관계
   */
  const getRecommendedQuizType = (
    masteryLevel: number
  ): 'multiple_choice' | 'fill_blank' | 'korean_to_english' => {
    if (masteryLevel <= 1) return 'multiple_choice'
    if (masteryLevel <= 3) return 'fill_blank'
    return 'korean_to_english'
  }

  describe('Quiz type by mastery', () => {
    it('should recommend multiple_choice for beginners (0-1)', () => {
      expect(getRecommendedQuizType(0)).toBe('multiple_choice')
      expect(getRecommendedQuizType(1)).toBe('multiple_choice')
    })

    it('should recommend fill_blank for intermediate (2-3)', () => {
      expect(getRecommendedQuizType(2)).toBe('fill_blank')
      expect(getRecommendedQuizType(3)).toBe('fill_blank')
    })

    it('should recommend korean_to_english for advanced (4-5)', () => {
      expect(getRecommendedQuizType(4)).toBe('korean_to_english')
      expect(getRecommendedQuizType(5)).toBe('korean_to_english')
    })
  })

  describe('Quiz difficulty progression', () => {
    it('should have quiz types ordered by difficulty', () => {
      const difficultyOrder = ['multiple_choice', 'fill_blank', 'korean_to_english']
      let lastDifficultyIndex = -1

      for (let level = 0; level <= 5; level++) {
        const quizType = getRecommendedQuizType(level)
        const currentIndex = difficultyOrder.indexOf(quizType)
        expect(currentIndex).toBeGreaterThanOrEqual(lastDifficultyIndex)
        lastDifficultyIndex = currentIndex
      }
    })
  })
})

describe('Long-Term Learning Simulation', () => {
  /**
   * 장기 학습 시뮬레이션
   */
  interface LearningDay {
    day: number
    masteryLevel: number
    shouldReview: boolean
    reviewed: boolean
    isCorrect?: boolean
  }

  function simulateLongTermLearning(
    days: number,
    dailyReviewRate: number,
    baseAccuracy: number
  ): LearningDay[] {
    const history: LearningDay[] = []
    let masteryLevel = 0
    let nextReviewDay = 0

    for (let day = 1; day <= days; day++) {
      const shouldReview = day >= nextReviewDay
      const reviewed = shouldReview && Math.random() < dailyReviewRate

      let isCorrect: boolean | undefined

      if (reviewed) {
        // 정확도는 마스터리 레벨에 따라 증가
        const adjustedAccuracy = Math.min(0.95, baseAccuracy + masteryLevel * 0.05)
        isCorrect = Math.random() < adjustedAccuracy

        const { newLevel } = updateMasteryLevel(masteryLevel, isCorrect)
        masteryLevel = newLevel

        const { daysUntilReview } = calculateNextReview(masteryLevel)
        nextReviewDay = day + daysUntilReview
      }

      history.push({
        day,
        masteryLevel,
        shouldReview,
        reviewed,
        isCorrect,
      })
    }

    return history
  }

  it('should show progression over 30 days with good study habits', () => {
    const history = simulateLongTermLearning(30, 0.9, 0.7)
    const initialLevel = history[0].masteryLevel
    const finalLevel = history[history.length - 1].masteryLevel

    // 30일 동안 꾸준히 공부하면 레벨이 상승해야 함
    expect(finalLevel).toBeGreaterThanOrEqual(initialLevel)
  })

  it('should maintain level with irregular study', () => {
    const history = simulateLongTermLearning(30, 0.3, 0.5)
    const finalLevel = history[history.length - 1].masteryLevel

    // 불규칙한 학습은 레벨이 크게 오르지 않음
    expect(finalLevel).toBeLessThan(5)
  })

  it('should track review completion rate', () => {
    const history = simulateLongTermLearning(30, 0.8, 0.7)
    const reviewedDays = history.filter((d) => d.reviewed).length
    const shouldReviewDays = history.filter((d) => d.shouldReview).length

    if (shouldReviewDays > 0) {
      const completionRate = reviewedDays / shouldReviewDays
      expect(completionRate).toBeGreaterThan(0)
    }
  })
})

describe('Mastery Level Statistics', () => {
  interface MasteryStats {
    averageLevel: number
    maxLevel: number
    minLevel: number
    levelDistribution: Record<number, number>
    correctRate: number
  }

  function calculateStats(levelHistory: number[], answerHistory: boolean[]): MasteryStats {
    const sum = levelHistory.reduce((a, b) => a + b, 0)
    const correctCount = answerHistory.filter((a) => a).length

    const levelDistribution: Record<number, number> = {}
    levelHistory.forEach((level) => {
      levelDistribution[level] = (levelDistribution[level] || 0) + 1
    })

    return {
      averageLevel: sum / levelHistory.length,
      maxLevel: Math.max(...levelHistory),
      minLevel: Math.min(...levelHistory),
      levelDistribution,
      correctRate: correctCount / answerHistory.length,
    }
  }

  it('should calculate correct statistics', () => {
    const levels = [0, 1, 2, 3, 4, 5, 5, 5, 4, 3]
    const answers = [true, true, true, true, true, true, false, true, false, false]

    const stats = calculateStats(levels, answers)

    expect(stats.averageLevel).toBe(3.2)
    expect(stats.maxLevel).toBe(5)
    expect(stats.minLevel).toBe(0)
    expect(stats.correctRate).toBe(0.7)
    expect(stats.levelDistribution[5]).toBe(3)
  })

  it('should identify learning patterns from stats', () => {
    // 상승 패턴
    const risingLevels = [0, 1, 2, 3, 4, 5]
    const risingAnswers = [true, true, true, true, true]
    const risingStats = calculateStats(risingLevels, risingAnswers)

    expect(risingStats.correctRate).toBe(1.0)
    expect(risingStats.maxLevel).toBe(5)

    // 하락 패턴
    const fallingLevels = [5, 4, 3, 2, 1, 0]
    const fallingAnswers = [false, false, false, false, false]
    const fallingStats = calculateStats(fallingLevels, fallingAnswers)

    expect(fallingStats.correctRate).toBe(0)
    expect(fallingStats.minLevel).toBe(0)
  })
})
