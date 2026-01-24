'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'

interface UsageExample {
  korean: string
  english: string
}

interface Alternative {
  expression: string
  situation: string
  difference: string
}

interface VocabularyProgress {
  mastery_level: number
  review_count: number
  correct_count: number
  last_reviewed_at: string | null
  next_review_at: string | null
}

interface VocabularyItem {
  id: string
  book_id: string
  korean_expression: string
  english_expression: string
  target_audience: string | null
  formality: 'casual' | 'neutral' | 'formal'
  context_explanation: string | null
  usage_examples: UsageExample[]
  alternatives: Alternative[]
  difficulty_level: number
  tags: string[]
  progress?: VocabularyProgress | null
}

interface VocabularyBook {
  id: string
  title: string
  description: string | null
  category: string
  is_public: boolean
  is_system: boolean
  cover_emoji: string
  expression_count: number
  items: VocabularyItem[]
}

interface BookStats {
  totalItems: number
  studiedItems: number
  masteredItems: number
  averageMastery: number
}

export default function VocabularyBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const { bookId } = use(params)
  const [book, setBook] = useState<VocabularyBook | null>(null)
  const [stats, setStats] = useState<BookStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const fetchBook = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vocabulary/books/${bookId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch book')
      }

      setBook(data.book)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    fetchBook()
  }, [fetchBook])

  const getMasteryColor = (level: number) => {
    if (level >= 4) return 'bg-green-500'
    if (level >= 3) return 'bg-lime-500'
    if (level >= 2) return 'bg-yellow-500'
    if (level >= 1) return 'bg-orange-500'
    return 'bg-gray-300'
  }

  const getMasteryText = (level: number) => {
    if (level >= 4) return '완벽'
    if (level >= 3) return '익숙'
    if (level >= 2) return '학습중'
    if (level >= 1) return '시작'
    return '미학습'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/vocabulary" className="text-gray-600 hover:text-gray-900">
              ← 단어장 목록
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error || '단어장을 찾을 수 없습니다.'}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/vocabulary" className="text-gray-600 hover:text-gray-900">
              ← 단어장 목록
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/vocabulary/${bookId}/study`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                학습하기
              </Link>
              <Link
                href={`/vocabulary/${bookId}/quiz`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                테스트
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Book Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{book.cover_emoji}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h1>
              {book.description && (
                <p className="text-gray-600 mb-4">{book.description}</p>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {book.items.length}개 표현
                </span>
                {book.is_system && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    기본 단어장
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
              <div className="text-xs text-gray-500">전체</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.studiedItems}</div>
              <div className="text-xs text-gray-500">학습함</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.masteredItems}</div>
              <div className="text-xs text-gray-500">완료</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">
                {(stats.averageMastery * 20).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">진행률</div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {book.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                className="w-full p-4 text-left flex items-center gap-4"
              >
                {/* Mastery Indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${getMasteryColor(
                      item.progress?.mastery_level || 0
                    )}`}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">
                    {getMasteryText(item.progress?.mastery_level || 0)}
                  </span>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {item.korean_expression}
                  </div>
                  <div className="text-sm text-indigo-600">
                    {item.english_expression}
                  </div>
                </div>

                {/* Expand Icon */}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedItem === item.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Expanded Content */}
              {expandedItem === item.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                  {/* 대상 & 격식 수준 */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.formality === 'casual' ? 'bg-green-100 text-green-700' :
                      item.formality === 'formal' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.formality === 'casual' ? '캐주얼' :
                       item.formality === 'formal' ? '격식' : '중립'}
                    </span>
                    {item.target_audience && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        👤 {item.target_audience}
                      </span>
                    )}
                  </div>

                  {/* Context */}
                  {item.context_explanation && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">상황 설명</div>
                      <div className="text-sm text-gray-700">
                        {item.context_explanation}
                      </div>
                    </div>
                  )}

                  {/* Usage Examples */}
                  {item.usage_examples && item.usage_examples.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">사용 예시</div>
                      <div className="space-y-2">
                        {item.usage_examples.map((example, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="text-gray-700">{example.korean}</div>
                            <div className="text-indigo-600">{example.english}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {item.alternatives && item.alternatives.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">대안 표현</div>
                      <div className="space-y-2">
                        {item.alternatives.map((alt, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-2">
                            <div className="text-sm font-medium text-gray-900">
                              {alt.expression}
                            </div>
                            <div className="text-xs text-gray-500">
                              {alt.situation} - {alt.difference}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
