import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// 환경 변수 검증 함수
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// 쿠키 설정 핸들러 생성
function createCookieHandler(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // Route Handler/Server Action에서는 정상 동작
          // Server Component에서는 쿠키 설정이 제한됨 (예상된 동작)
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[Supabase] Cookie set failed for "${name}":`,
              error instanceof Error ? error.message : 'Unknown error'
            )
          }
        }
      })
    },
  }
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: createCookieHandler(cookieStore),
    }
  )
}

export async function createServiceRoleClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      cookies: createCookieHandler(cookieStore),
    }
  )
}
