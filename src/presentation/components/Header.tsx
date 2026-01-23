'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/client'
import { Button } from '@/components/ui/button'
import { User, LogOut, History, Brain, Settings } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            Oh My English!
          </Link>

          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link href="/history">
                      <Button variant="ghost" size="sm">
                        <History className="h-4 w-4 mr-1" />
                        기록
                      </Button>
                    </Link>
                    <Link href="/quiz">
                      <Button variant="ghost" size="sm">
                        <Brain className="h-4 w-4 mr-1" />
                        퀴즈
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="ghost" size="icon" aria-label="설정">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button size="sm">
                      <User className="h-4 w-4 mr-1" />
                      로그인
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
