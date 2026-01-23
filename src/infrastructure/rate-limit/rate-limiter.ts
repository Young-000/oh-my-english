/**
 * 간단한 인메모리 Rate Limiter
 * 프로덕션에서는 Redis(Upstash) 사용 권장
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  /** 윈도우 내 최대 요청 수 */
  maxRequests: number
  /** 윈도우 크기 (밀리초) */
  windowMs: number
}

// 기본 설정: 분당 20회 요청
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1분
}

// IP별 요청 기록 저장 (서버 재시작 시 초기화)
const rateLimitStore = new Map<string, RateLimitEntry>()

// 주기적으로 만료된 항목 정리 (메모리 누수 방지)
const CLEANUP_INTERVAL = 60 * 1000 // 1분마다 정리
let cleanupInitialized = false

function initCleanup(): void {
  if (cleanupInitialized) return
  cleanupInitialized = true

  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

export interface RateLimitResult {
  /** 요청 허용 여부 */
  success: boolean
  /** 남은 요청 수 */
  remaining: number
  /** 제한 초기화까지 남은 시간 (초) */
  resetInSeconds: number
  /** 총 허용 요청 수 */
  limit: number
}

/**
 * Rate limit 확인
 * @param identifier - 식별자 (IP 주소 또는 사용자 ID)
 * @param config - Rate limit 설정 (선택)
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  initCleanup()

  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // 새로운 윈도우 시작 또는 기존 윈도우 만료
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
  }

  // 요청 카운트 증가
  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, maxRequests - entry.count)
  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000)

  return {
    success: entry.count <= maxRequests,
    remaining,
    resetInSeconds,
    limit: maxRequests,
  }
}

/**
 * Rate limit 상태만 확인 (카운트 증가 없음)
 */
export function getRateLimitStatus(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetAt <= now) {
    return {
      success: true,
      remaining: maxRequests,
      resetInSeconds: Math.ceil(windowMs / 1000),
      limit: maxRequests,
    }
  }

  return {
    success: entry.count < maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    limit: maxRequests,
  }
}

/**
 * 특정 식별자의 rate limit 초기화 (테스트용)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * 모든 rate limit 초기화 (테스트용)
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear()
}

// Rate limit 설정 프리셋
export const RATE_LIMIT_PRESETS = {
  /** 번역 API: 분당 20회 */
  translation: { maxRequests: 20, windowMs: 60 * 1000 },
  /** 퀴즈 API: 분당 30회 */
  quiz: { maxRequests: 30, windowMs: 60 * 1000 },
  /** 인증 API: 분당 5회 (보안) */
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
  /** 일반 API: 분당 60회 */
  general: { maxRequests: 60, windowMs: 60 * 1000 },
} as const
