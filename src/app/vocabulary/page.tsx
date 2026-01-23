'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Flame, Target, Trophy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VocabularyBook {
  id: string
  title: string
  description: string | null
  category: string
  is_public: boolean
  is_system: boolean
  cover_emoji: string
  expression_count: number
  created_at: string
}

interface MiniStats {
  currentStreak: number
  todayCompleted: number
  masteredItems: number
}

export default function VocabularyPage() {
  const [books, setBooks] = useState<VocabularyBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'user'>('all')
  const [miniStats, setMiniStats] = useState<MiniStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const fetchBooks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vocabulary/books?type=${activeTab}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch books')
      }

      setBooks(data.books || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  const fetchMiniStats = useCallback(async () => {
    try {
      const response = await fetch('/api/vocabulary/statistics')
      if (response.ok) {
        const data = await response.json()
        if (data.statistics) {
          setMiniStats({
            currentStreak: data.statistics.currentStreak || 0,
            todayCompleted: data.statistics.todayCompleted || 0,
            masteredItems: data.statistics.masteredItems || 0,
          })
        }
      }
    } catch {
      // Silently fail - mini stats are optional
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  useEffect(() => {
    fetchMiniStats()
  }, [fetchMiniStats])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      greeting: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      emotion: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    }
    return colors[category] || colors.general
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
            <h1 className="text-xl font-bold">단어장</h1>
            <Link href="/vocabulary/statistics">
              <Button variant="ghost" size="sm" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">통계</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Mini Stats Summary */}
        <div className="mb-6">
          {statsLoading ? (
            <div className="flex items-center gap-2 h-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">통계 불러오는 중...</span>
            </div>
          ) : miniStats && (miniStats.currentStreak > 0 || miniStats.todayCompleted > 0 || miniStats.masteredItems > 0) ? (
            <div className="flex flex-wrap items-center gap-3">
              {miniStats.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm">
                  <Flame className="h-4 w-4" />
                  <span className="font-medium">{miniStats.currentStreak}일 연속</span>
                </div>
              )}
              {miniStats.todayCompleted > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">오늘 {miniStats.todayCompleted}개</span>
                </div>
              )}
              {miniStats.masteredItems > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm">
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">{miniStats.masteredItems}개 마스터</span>
                </div>
              )}
              <Link
                href="/vocabulary/statistics"
                className="text-sm text-primary hover:underline"
              >
                자세히 보기
              </Link>
            </div>
          ) : (
            <Link
              href="/vocabulary/statistics"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              학습 통계 보기
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'system'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            기본 단어장
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            내 단어장
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">단어장을 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && books.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2">
              단어장이 없습니다
            </h3>
            <p className="text-muted-foreground">
              {activeTab === 'user'
                ? '학습한 표현으로 나만의 단어장을 만들어보세요!'
                : '표시할 단어장이 없습니다.'}
            </p>
          </div>
        )}

        {/* Books Grid */}
        {!isLoading && !error && books.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/vocabulary/${book.id}`}
                className="block bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{book.cover_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {book.title}
                      </h3>
                      {book.is_system && (
                        <span className="shrink-0 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          기본
                        </span>
                      )}
                    </div>
                    {book.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {book.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                          book.category
                        )}`}
                      >
                        {book.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {book.expression_count}개 표현
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
