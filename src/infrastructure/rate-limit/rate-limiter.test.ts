import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  resetAllRateLimits,
  RATE_LIMIT_PRESETS,
} from './rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetAllRateLimits()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const config = { maxRequests: 3, windowMs: 1000 }

      const result1 = checkRateLimit('test-ip', config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = checkRateLimit('test-ip', config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = checkRateLimit('test-ip', config)
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('should block requests exceeding limit', () => {
      const config = { maxRequests: 2, windowMs: 1000 }

      checkRateLimit('test-ip', config)
      checkRateLimit('test-ip', config)

      const result = checkRateLimit('test-ip', config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', () => {
      const config = { maxRequests: 1, windowMs: 1000 }

      const result1 = checkRateLimit('test-ip', config)
      expect(result1.success).toBe(true)

      const result2 = checkRateLimit('test-ip', config)
      expect(result2.success).toBe(false)

      // 윈도우 만료 후
      vi.advanceTimersByTime(1001)

      const result3 = checkRateLimit('test-ip', config)
      expect(result3.success).toBe(true)
    })

    it('should track different identifiers separately', () => {
      const config = { maxRequests: 1, windowMs: 1000 }

      checkRateLimit('ip-1', config)
      const result1 = checkRateLimit('ip-1', config)
      expect(result1.success).toBe(false)

      // 다른 IP는 별도로 카운트
      const result2 = checkRateLimit('ip-2', config)
      expect(result2.success).toBe(true)
    })

    it('should return correct resetInSeconds', () => {
      const config = { maxRequests: 1, windowMs: 5000 }

      const result = checkRateLimit('test-ip', config)
      expect(result.resetInSeconds).toBe(5)

      vi.advanceTimersByTime(2000)

      const result2 = checkRateLimit('test-ip', config)
      expect(result2.resetInSeconds).toBe(3)
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return status without incrementing count', () => {
      const config = { maxRequests: 2, windowMs: 1000 }

      checkRateLimit('test-ip', config)

      const status = getRateLimitStatus('test-ip', config)
      expect(status.remaining).toBe(1)

      // 상태 확인은 카운트를 증가시키지 않음
      const status2 = getRateLimitStatus('test-ip', config)
      expect(status2.remaining).toBe(1)
    })

    it('should return full quota for unknown identifier', () => {
      const config = { maxRequests: 10, windowMs: 1000 }

      const status = getRateLimitStatus('unknown-ip', config)
      expect(status.success).toBe(true)
      expect(status.remaining).toBe(10)
    })
  })

  describe('resetRateLimit', () => {
    it('should reset specific identifier', () => {
      const config = { maxRequests: 1, windowMs: 10000 }

      checkRateLimit('test-ip', config)
      const blocked = checkRateLimit('test-ip', config)
      expect(blocked.success).toBe(false)

      resetRateLimit('test-ip')

      const afterReset = checkRateLimit('test-ip', config)
      expect(afterReset.success).toBe(true)
    })
  })

  describe('RATE_LIMIT_PRESETS', () => {
    it('should have translation preset', () => {
      expect(RATE_LIMIT_PRESETS.translation).toEqual({
        maxRequests: 20,
        windowMs: 60 * 1000,
      })
    })

    it('should have auth preset with stricter limits', () => {
      expect(RATE_LIMIT_PRESETS.auth.maxRequests).toBe(5)
    })

    it('should have general preset', () => {
      expect(RATE_LIMIT_PRESETS.general.maxRequests).toBe(60)
    })
  })
})
