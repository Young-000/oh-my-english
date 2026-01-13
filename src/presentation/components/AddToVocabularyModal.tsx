'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus, Check, Loader2 } from 'lucide-react'

interface VocabularyBook {
  id: string
  title: string
  cover_emoji: string
  expression_count: number
  is_system: boolean
}

interface AddToVocabularyModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (bookId: string) => Promise<void>
  koreanExpression: string
  englishExpression: string
}

export function AddToVocabularyModal({
  isOpen,
  onClose,
  onAdd,
  koreanExpression,
  englishExpression,
}: AddToVocabularyModalProps) {
  const [books, setBooks] = useState<VocabularyBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchBooks = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vocabulary/books?type=user')
      const data = await response.json()

      if (response.ok) {
        setBooks(data.books || [])
      }
    } catch (err) {
      console.error('Failed to fetch books:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchBooks()
      setSuccess(false)
      setError(null)
    }
  }, [isOpen, fetchBooks])

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/vocabulary/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBookTitle.trim(),
          coverEmoji: '📖',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create book')
      }

      setBooks((prev) => [data.book, ...prev])
      setSelectedBookId(data.book.id)
      setNewBookTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create book')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAdd = async () => {
    if (!selectedBookId) return

    setIsSaving(true)
    setError(null)

    try {
      await onAdd(selectedBookId)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expression')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">단어장에 추가</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Expression Preview */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-4">
            <div className="text-gray-700 mb-1">{koreanExpression}</div>
            <div className="text-indigo-600 font-medium">{englishExpression}</div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl mb-4">
              <Check className="h-5 w-5" />
              <span>단어장에 추가되었습니다!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Create New Book */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="새 단어장 이름..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBook()
                }}
              />
              <Button
                onClick={handleCreateBook}
                disabled={!newBookTitle.trim() || isCreating}
                size="sm"
                className="shrink-0"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Book List */}
          <div className="text-sm text-gray-500 mb-2">내 단어장 선택</div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                아직 단어장이 없습니다. 위에서 새로 만들어보세요!
              </div>
            ) : (
              books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    selectedBookId === book.id
                      ? 'bg-indigo-100 border-2 border-indigo-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <span className="text-2xl">{book.cover_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {book.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {book.expression_count}개 표현
                    </div>
                  </div>
                  {selectedBookId === book.id && (
                    <Check className="h-5 w-5 text-indigo-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedBookId || isSaving || success}
              className="flex-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {success ? '추가됨!' : '추가하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
