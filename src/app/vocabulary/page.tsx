'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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

export default function VocabularyPage() {
  const [books, setBooks] = useState<VocabularyBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'user'>('all')

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

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      greeting: 'bg-green-100 text-green-700',
      emotion: 'bg-pink-100 text-pink-700',
      daily: 'bg-blue-100 text-blue-700',
      business: 'bg-purple-100 text-purple-700',
      food: 'bg-orange-100 text-orange-700',
      general: 'bg-gray-100 text-gray-700',
    }
    return colors[category] || colors.general
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← 홈으로
            </Link>
            <h1 className="text-xl font-bold text-gray-900">단어장</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            기본 단어장
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            내 단어장
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && books.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              단어장이 없습니다
            </h3>
            <p className="text-gray-500">
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
                className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{book.cover_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {book.title}
                      </h3>
                      {book.is_system && (
                        <span className="shrink-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          기본
                        </span>
                      )}
                    </div>
                    {book.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
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
                      <span className="text-xs text-gray-400">
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
