import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 환경 변수 검증 함수
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Open Redirect 방지: 내부 경로만 허용
function getSafeRedirectPath(path: string | null): string {
  if (!path) return '/'
  // 절대 URL이나 프로토콜 상대 URL 차단
  if (path.startsWith('//') || path.includes('://')) {
    return '/'
  }
  // 내부 경로만 허용 (슬래시로 시작)
  return path.startsWith('/') ? path : '/'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch (error) {
                // Route Handler에서는 정상 동작, Server Component에서는 제한됨
                if (process.env.NODE_ENV === 'development') {
                  console.warn(
                    `[Auth Callback] Cookie set failed for "${name}":`,
                    error instanceof Error ? error.message : 'Unknown error'
                  )
                }
              }
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Service Role로 profile 생성 (RLS 우회)
        const supabaseAdmin = createClient(
          getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
          getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
        )

        // profile이 있는지 확인
        const { data: existingProfile, error: selectError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (selectError && selectError.code !== 'PGRST116') {
          // PGRST116 = not found (정상 케이스)
          console.error('[Auth Callback] Profile check failed:', selectError)
        }

        // profile이 없으면 생성
        if (!existingProfile) {
          const { error: insertError } = await supabaseAdmin.from('profiles').insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email,
          })

          if (insertError) {
            console.error('[Auth Callback] Profile creation failed:', insertError)
            // 프로필 생성 실패 시에도 로그인은 진행하되, 경고 쿼리 파라미터 추가
            return NextResponse.redirect(`${origin}${next}?profile_warning=true`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
