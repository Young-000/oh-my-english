import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 환경 변수 검증 함수
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '새 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 쿠키에서 세션 가져오기
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
                // Route Handler에서는 정상 동작
                if (process.env.NODE_ENV === 'development') {
                  console.warn(
                    `[Reset Password] Cookie set failed for "${name}":`,
                    error instanceof Error ? error.message : 'Unknown error'
                  )
                }
              }
            })
          },
        },
      }
    )

    // 현재 세션 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: '세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.' },
        { status: 401 }
      )
    }

    // 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      console.error('Password update error:', updateError)

      // 일반적인 오류 메시지
      let errorMessage = '비밀번호 변경에 실패했습니다.'

      if (updateError.message.includes('same password')) {
        errorMessage = '현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.'
      } else if (updateError.message.includes('weak')) {
        errorMessage = '비밀번호가 너무 약합니다. 더 강력한 비밀번호를 입력해주세요.'
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
