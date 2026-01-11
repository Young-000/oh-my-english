import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Service Role로 Supabase Admin 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 먼저 사용자가 존재하는지 확인
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    // 사용자가 없으면 먼저 생성하고 profile도 생성
    if (!existingUser) {
      // 새 사용자 생성
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        )
      }

      // Profile 생성
      if (newUser?.user) {
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
          id: newUser.user.id,
          email: newUser.user.email,
          display_name: newUser.user.email,
        })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // profile 생성 실패해도 로그인은 진행
        }
      }
    }

    // Magic Link 발송 (anon key로도 가능하지만 admin으로 발송)
    const { error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (otpError) {
      // generateLink가 실패하면 일반 signInWithOtp 사용
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: signInError } = await anonClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (signInError) {
        return NextResponse.json(
          { error: signInError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
