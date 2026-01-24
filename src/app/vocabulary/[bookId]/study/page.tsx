'use client'

import { useState, useEffect, use, useCallback } from 'react'
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
}

interface VocabularyBook {
  id: string
  title: string
  cover_emoji: string
  items: VocabularyItem[]
}

export default function StudyPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const { bookId } = use(params)
  const [book, setBook] = useState<VocabularyBook | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studiedCount, setStudiedCount] = useState(0)
  const [knownCount, setKnownCount] = useState(0)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    fetchBook()
  }, [fetchBook])

  const handleNext = useCallback(() => {
    if (!book) return
    setIsFlipped(false)
    setShowDetails(false)
    setStudiedCount((prev) => prev + 1)
    setCurrentIndex((prev) => (prev + 1) % book.items.length)
  }, [book])

  const handlePrev = useCallback(() => {
    if (!book) return
    setIsFlipped(false)
    setShowDetails(false)
    setCurrentIndex((prev) => (prev - 1 + book.items.length) % book.items.length)
  }, [book])

  const handleKnown = useCallback(() => {
    setKnownCount((prev) => prev + 1)
    handleNext()
  }, [handleNext])

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          handleFlip()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrev()
          break
        case 'ArrowUp':
          handleKnown()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFlip, handleNext, handlePrev, handleKnown])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (error || !book || book.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link
              href={`/vocabulary/${bookId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 단어장으로
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error || '학습할 표현이 없습니다.'}
          </div>
        </main>
      </div>
    )
  }

  const currentItem = book.items[currentIndex]
  const progress = ((currentIndex + 1) / book.items.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/vocabulary/${bookId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 단어장으로
            </Link>
            <div className="text-sm text-gray-600">
              {book.cover_emoji} {book.title}
            </div>
            <div className="text-sm text-gray-500">
              {currentIndex + 1} / {book.items.length}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{studiedCount}</div>
            <div className="text-xs text-gray-500">학습</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{knownCount}</div>
            <div className="text-xs text-gray-500">알아요</div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="perspective-1000 mb-6">
          <div
            onClick={handleFlip}
            className={`relative w-full min-h-[300px] cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front (Korean) */}
            <div
              className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-3xl font-bold text-gray-900 text-center mb-4">
                {currentItem.korean_expression}
              </div>
              <div className="text-sm text-gray-400">탭하여 뒤집기</div>
            </div>

            {/* Back (English) */}
            <div
              className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="text-3xl font-bold text-white text-center mb-4">
                {currentItem.english_expression}
              </div>
              {/* 대상 & 격식 수준 */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  currentItem.formality === 'casual' ? 'bg-green-400/30 text-green-100' :
                  currentItem.formality === 'formal' ? 'bg-purple-400/30 text-purple-100' :
                  'bg-blue-400/30 text-blue-100'
                }`}>
                  {currentItem.formality === 'casual' ? '캐주얼' :
                   currentItem.formality === 'formal' ? '격식' : '중립'}
                </span>
                {currentItem.target_audience && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    {currentItem.target_audience}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={handlePrev}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            ← 이전
          </button>
          <button
            onClick={handleKnown}
            className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            알아요 ✓
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            다음 →
          </button>
        </div>

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          {showDetails ? '상세 정보 숨기기 ▲' : '상세 정보 보기 ▼'}
        </button>

        {/* Details Panel */}
        {showDetails && (
          <div className="mt-4 bg-white rounded-xl shadow-sm p-6 space-y-4">
            {/* Context */}
            {currentItem.context_explanation && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  상황 설명
                </div>
                <div className="text-gray-700">{currentItem.context_explanation}</div>
              </div>
            )}

            {/* Usage Examples */}
            {currentItem.usage_examples && currentItem.usage_examples.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  사용 예시
                </div>
                <div className="space-y-2">
                  {currentItem.usage_examples.map((example, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-700">{example.korean}</div>
                      <div className="text-indigo-600">{example.english}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {currentItem.alternatives && currentItem.alternatives.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  대안 표현
                </div>
                <div className="space-y-2">
                  {currentItem.alternatives.map((alt, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">{alt.expression}</div>
                      <div className="text-sm text-gray-500">
                        {alt.situation} - {alt.difference}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {currentItem.tags && currentItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {currentItem.tags.map((tag, idx) => (
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

        {/* Keyboard Hints */}
        <div className="mt-8 text-center text-xs text-gray-400">
          키보드: Space/Enter 뒤집기 | ← → 이동 | ↑ 알아요
        </div>
      </main>
    </div>
  )
}
