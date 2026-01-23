import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMIT_PRESETS } from './rate-limiter'

type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS

/**
 * 클라이언트 IP 주소 추출
 */
export function getClientIP(request: NextRequest): string {
  // Vercel / Cloudflare 등의 프록시 헤더 확인
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // 첫 번째 IP가 실제 클라이언트
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Vercel Edge
  const vercelIP = request.headers.get('x-vercel-ip')
  if (vercelIP) {
    return vercelIP
  }

  // fallback
  return 'unknown'
}

/**
 * Rate limit 응답 헤더 설정
 */
function setRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetInSeconds: number,
  limit: number
): void {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetInSeconds.toString())
}

/**
 * Rate limit 초과 시 응답
 */
function createRateLimitExceededResponse(
  resetInSeconds: number,
  limit: number
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      message: `요청 한도를 초과했습니다. ${resetInSeconds}초 후에 다시 시도해주세요.`,
      retryAfter: resetInSeconds,
    },
    { status: 429 }
  )

  setRateLimitHeaders(response, 0, resetInSeconds, limit)
  response.headers.set('Retry-After', resetInSeconds.toString())

  return response
}

/**
 * API Route용 Rate Limit 미들웨어
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = withRateLimit(request, 'translation')
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // 정상 처리...
 * }
 * ```
 */
export function withRateLimit(
  request: NextRequest,
  preset: RateLimitPreset = 'general'
): NextResponse | null {
  const ip = getClientIP(request)
  const config = RATE_LIMIT_PRESETS[preset]

  // IP와 preset 조합으로 키 생성 (같은 IP여도 다른 API는 별도 제한)
  const identifier = `${ip}:${preset}`
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    return createRateLimitExceededResponse(result.resetInSeconds, result.limit)
  }

  return null // 제한 없음 - 정상 진행
}

/**
 * Rate limit 정보를 응답에 추가하는 헬퍼
 */
export function addRateLimitInfoToResponse(
  response: NextResponse,
  request: NextRequest,
  preset: RateLimitPreset = 'general'
): NextResponse {
  const ip = getClientIP(request)
  const config = RATE_LIMIT_PRESETS[preset]
  const identifier = `${ip}:${preset}`

  // 현재 상태 확인 (카운트 증가 없이)
  const { remaining, resetInSeconds, limit } = checkRateLimit(identifier, config)

  setRateLimitHeaders(response, remaining - 1, resetInSeconds, limit)

  return response
}
