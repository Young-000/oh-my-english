import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  REVIEW_INTERVALS,
  calculateNextReview,
  calculateNewMasteryLevel,
} from '../spaced-repetition'

describe('Spaced Repetition Algorithm', () => {
  describe('REVIEW_INTERVALS', () => {
    it('6단계 복습 간격이 정의되어 있어야 한다', () => {
      expect(REVIEW_INTERVALS).toHaveLength(6)
    })

    it('복습 간격이 점진적으로 증가해야 한다', () => {
      for (let i = 1; i < REVIEW_INTERVALS.length; i++) {
        expect(REVIEW_INTERVALS[i]).toBeGreaterThan(REVIEW_INTERVALS[i - 1])
      }
    })

    it('첫 복습은 1일 후여야 한다', () => {
      expect(REVIEW_INTERVALS[0]).toBe(1)
    })

    it('마지막 복습은 60일 후여야 한다', () => {
      expect(REVIEW_INTERVALS[5]).toBe(60)
    })

    it('예상 간격 값과 일치해야 한다', () => {
      expect(REVIEW_INTERVALS).toEqual([1, 3, 7, 14, 30, 60])
    })
  })

  describe('calculateNextReview', () => {
    beforeEach(() => {
      // 테스트 시간을 고정 (2024-01-15 12:00:00)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('masteryLevel 0이면 1일 후 복습이어야 한다', () => {
      const nextReview = calculateNextReview(0)
      const expected = new Date('2024-01-16T12:00:00Z')

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('masteryLevel 1이면 3일 후 복습이어야 한다', () => {
      const nextReview = calculateNextReview(1)
      const expected = new Date('2024-01-18T12:00:00Z')

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('masteryLevel 2이면 7일 후 복습이어야 한다', () => {
      const nextReview = calculateNextReview(2)
      const expected = new Date('2024-01-22T12:00:00Z')

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('masteryLevel 3이면 14일 후 복습이어야 한다', () => {
      const nextReview = calculateNextReview(3)
      const expected = new Date('2024-01-29T12:00:00Z')

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('masteryLevel 4이면 30일 후 복습이어야 한다', () => {
      const nextReview = calculateNextReview(4)
      const expected = new Date('2024-02-14T12:00:00Z')

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('masteryLevel 5이면 60일 후 복습이어야 한다', () => {
      const nextReview = calculateNextReview(5)
      const expected = new Date('2024-03-15T12:00:00Z')

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('음수 masteryLevel은 0으로 처리해야 한다', () => {
      const nextReview = calculateNextReview(-1)
      const expected = calculateNextReview(0)

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('6 이상의 masteryLevel은 5로 처리해야 한다', () => {
      const nextReview = calculateNextReview(10)
      const expected = calculateNextReview(5)

      expect(nextReview.toDateString()).toBe(expected.toDateString())
    })

    it('Date 객체를 반환해야 한다', () => {
      const nextReview = calculateNextReview(0)

      expect(nextReview).toBeInstanceOf(Date)
    })

    it('미래 날짜를 반환해야 한다', () => {
      const now = new Date()
      const nextReview = calculateNextReview(0)

      expect(nextReview.getTime()).toBeGreaterThan(now.getTime())
    })
  })

  describe('calculateNewMasteryLevel', () => {
    describe('정답일 때', () => {
      it('masteryLevel이 1 증가해야 한다', () => {
        expect(calculateNewMasteryLevel(0, true)).toBe(1)
        expect(calculateNewMasteryLevel(2, true)).toBe(3)
        expect(calculateNewMasteryLevel(4, true)).toBe(5)
      })

      it('최대값 5를 초과하면 안 된다', () => {
        expect(calculateNewMasteryLevel(5, true)).toBe(5)
        expect(calculateNewMasteryLevel(6, true)).toBe(5) // 비정상 입력도 처리
      })
    })

    describe('오답일 때', () => {
      it('masteryLevel이 1 감소해야 한다', () => {
        expect(calculateNewMasteryLevel(5, false)).toBe(4)
        expect(calculateNewMasteryLevel(3, false)).toBe(2)
        expect(calculateNewMasteryLevel(1, false)).toBe(0)
      })

      it('최소값 0 미만으로 내려가면 안 된다', () => {
        expect(calculateNewMasteryLevel(0, false)).toBe(0)
        expect(calculateNewMasteryLevel(-1, false)).toBe(0) // 비정상 입력도 처리
      })
    })

    describe('경계값 테스트', () => {
      it('모든 레벨에서 정답 처리가 정확해야 한다', () => {
        expect(calculateNewMasteryLevel(0, true)).toBe(1)
        expect(calculateNewMasteryLevel(1, true)).toBe(2)
        expect(calculateNewMasteryLevel(2, true)).toBe(3)
        expect(calculateNewMasteryLevel(3, true)).toBe(4)
        expect(calculateNewMasteryLevel(4, true)).toBe(5)
        expect(calculateNewMasteryLevel(5, true)).toBe(5)
      })

      it('모든 레벨에서 오답 처리가 정확해야 한다', () => {
        expect(calculateNewMasteryLevel(5, false)).toBe(4)
        expect(calculateNewMasteryLevel(4, false)).toBe(3)
        expect(calculateNewMasteryLevel(3, false)).toBe(2)
        expect(calculateNewMasteryLevel(2, false)).toBe(1)
        expect(calculateNewMasteryLevel(1, false)).toBe(0)
        expect(calculateNewMasteryLevel(0, false)).toBe(0)
      })
    })
  })

  describe('통합 시나리오', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('새로운 단어 학습 시나리오: 초기 → 연속 정답', () => {
      let mastery = 0

      // 1일차: 첫 학습, 정답
      mastery = calculateNewMasteryLevel(mastery, true)
      expect(mastery).toBe(1)

      // 3일 후: 정답
      mastery = calculateNewMasteryLevel(mastery, true)
      expect(mastery).toBe(2)

      // 7일 후: 정답
      mastery = calculateNewMasteryLevel(mastery, true)
      expect(mastery).toBe(3)

      // 다음 복습은 14일 후
      const nextReview = calculateNextReview(mastery)
      expect(nextReview.toDateString()).toBe(new Date('2024-01-29T12:00:00Z').toDateString())
    })

    it('학습 실패 시나리오: 레벨 감소 후 회복', () => {
      let mastery = 3

      // 오답 2번
      mastery = calculateNewMasteryLevel(mastery, false)
      expect(mastery).toBe(2)

      mastery = calculateNewMasteryLevel(mastery, false)
      expect(mastery).toBe(1)

      // 다시 정답으로 회복
      mastery = calculateNewMasteryLevel(mastery, true)
      expect(mastery).toBe(2)

      mastery = calculateNewMasteryLevel(mastery, true)
      expect(mastery).toBe(3)
    })

    it('완전 숙달 시나리오: 최대 레벨 도달', () => {
      let mastery = 0

      // 연속 6번 정답
      for (let i = 0; i < 6; i++) {
        mastery = calculateNewMasteryLevel(mastery, true)
      }

      expect(mastery).toBe(5)

      // 최대 레벨에서 복습 간격 확인
      const nextReview = calculateNextReview(mastery)
      const daysDiff = Math.round(
        (nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(60)
    })
  })
})
