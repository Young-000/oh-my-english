import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateNextReview, REVIEW_INTERVALS } from './spaced-repetition'

describe('spaced-repetition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('calculateNextReview', () => {
    it('should return next review date based on mastery level', () => {
      const result = calculateNextReview(0)

      const expectedDate = new Date('2024-01-15T10:00:00Z')
      expectedDate.setDate(expectedDate.getDate() + REVIEW_INTERVALS[0])

      expect(result.getTime()).toBe(expectedDate.getTime())
    })

    it('should use correct intervals for each mastery level', () => {
      REVIEW_INTERVALS.forEach((interval, level) => {
        const result = calculateNextReview(level)

        const expectedDate = new Date('2024-01-15T10:00:00Z')
        expectedDate.setDate(expectedDate.getDate() + interval)

        expect(result.getTime()).toBe(expectedDate.getTime())
      })
    })

    it('should use max interval for mastery level beyond defined intervals', () => {
      const result = calculateNextReview(10) // 정의된 범위 초과

      const maxInterval = REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]
      const expectedDate = new Date('2024-01-15T10:00:00Z')
      expectedDate.setDate(expectedDate.getDate() + maxInterval)

      expect(result.getTime()).toBe(expectedDate.getTime())
    })

    it('should use min interval for negative mastery level', () => {
      const result = calculateNextReview(-1)

      const expectedDate = new Date('2024-01-15T10:00:00Z')
      expectedDate.setDate(expectedDate.getDate() + REVIEW_INTERVALS[0])

      expect(result.getTime()).toBe(expectedDate.getTime())
    })
  })
})
