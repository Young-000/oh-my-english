'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import Link from 'next/link'

interface VocabularyItem {
  id: string
  book_id: string
  korean_expression: string
  english_expression: string
  pronunciation_guide: string | null
  context_explanation: string | null
}

interface VocabularyBook {
  id: string
  title: string
  cover_emoji: string
  items: VocabularyItem[]
}

interface QuizQuestion {
  item: VocabularyItem
  type: 'korean_to_english' | 'english_to_korean'
  options: string[]
  correctAnswer: string
}

interface QuizResult {
  question: QuizQuestion
  userAnswer: string
  isCorrect: boolean
  timeTaken: number
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateQuestions(items: VocabularyItem[], count: number): QuizQuestion[] {
  const shuffledItems = shuffleArray(items)
  const selectedItems = shuffledItems.slice(0, Math.min(count, shuffledItems.length))

  return selectedItems.map((item, index) => {
    // Alternate between question types
    const type: QuizQuestion['type'] =
      index % 2 === 0 ? 'korean_to_english' : 'english_to_korean'

    const correctAnswer =
      type === 'korean_to_english' ? item.english_expression : item.korean_expression

    // Generate wrong options
    const otherItems = items.filter((i) => i.id !== item.id)
    const wrongOptions = shuffleArray(otherItems)
      .slice(0, 3)
      .map((i) =>
        type === 'korean_to_english' ? i.english_expression : i.korean_expression
      )

    const options = shuffleArray([correctAnswer, ...wrongOptions])

    return {
      item,
      type,
      options,
      correctAnswer,
    }
  })
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const { bookId } = use(params)
  const [book, setBook] = useState<VocabularyBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [questionCount, setQuestionCount] = useState(10)

  const questionStartTime = useRef<number>(0)

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

  const startQuiz = () => {
    if (!book) return
    const generatedQuestions = generateQuestions(book.items, questionCount)
    setQuestions(generatedQuestions)
    setCurrentIndex(0)
    setResults([])
    setQuizStarted(true)
    setQuizCompleted(false)
    questionStartTime.current = Date.now()
  }

  const handleAnswer = useCallback(
    (answer: string) => {
      if (showResult || !questions[currentIndex]) return

      const timeTaken = Date.now() - questionStartTime.current
      const currentQuestion = questions[currentIndex]
      const isCorrect = answer === currentQuestion.correctAnswer

      setSelectedAnswer(answer)
      setShowResult(true)

      setResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          userAnswer: answer,
          isCorrect,
          timeTaken,
        },
      ])
    },
    [showResult, questions, currentIndex]
  )

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setQuizCompleted(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      questionStartTime.current = Date.now()
    }
  }, [currentIndex, questions.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!quizStarted || quizCompleted) return

      if (showResult) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          nextQuestion()
        }
      } else {
        const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
        if (keyMap[e.key] !== undefined && questions[currentIndex]?.options[keyMap[e.key]]) {
          handleAnswer(questions[currentIndex].options[keyMap[e.key]])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quizStarted, quizCompleted, showResult, nextQuestion, handleAnswer, questions, currentIndex])

  const correctCount = results.filter((r) => r.isCorrect).length
  const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (error || !book || book.items.length < 4) {
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
            {error || '테스트를 진행하려면 최소 4개 이상의 표현이 필요합니다.'}
          </div>
        </main>
      </div>
    )
  }

  // Quiz Setup Screen
  if (!quizStarted) {
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

        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">{book.cover_emoji}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-gray-500 mb-6">테스트 설정</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 수
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={5}>5문제</option>
                <option value={10}>10문제</option>
                <option value={15}>15문제</option>
                <option value={20}>20문제</option>
                <option value={book.items.length}>전체 ({book.items.length}문제)</option>
              </select>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 한국어 → 영어 / 영어 → 한국어 혼합</div>
                <div>• 4지선다 객관식</div>
                <div>• 키보드 1, 2, 3, 4로 빠른 선택</div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-lg"
            >
              테스트 시작
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Quiz Completed Screen
  if (quizCompleted) {
    const avgTime = results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length
    const grade =
      accuracy >= 90 ? 'A+' : accuracy >= 80 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 60 ? 'C' : 'D'

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

        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">
              {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">테스트 완료!</h1>

            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-indigo-600">{grade}</div>
                <div className="text-xs text-gray-500">등급</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-600">
                  {correctCount}/{results.length}
                </div>
                <div className="text-xs text-gray-500">정답</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-600">
                  {accuracy.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">정확도</div>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-6">
              평균 응답 시간: {(avgTime / 1000).toFixed(1)}초
            </div>

            {/* Wrong Answers Review */}
            {results.filter((r) => !r.isCorrect).length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">틀린 문제</div>
                <div className="space-y-2 text-left max-h-48 overflow-y-auto">
                  {results
                    .filter((r) => !r.isCorrect)
                    .map((r, idx) => (
                      <div
                        key={idx}
                        className="bg-red-50 rounded-lg p-3 text-sm"
                      >
                        <div className="text-gray-700">
                          {r.question.type === 'korean_to_english'
                            ? r.question.item.korean_expression
                            : r.question.item.english_expression}
                        </div>
                        <div className="text-red-600">
                          내 답: {r.userAnswer}
                        </div>
                        <div className="text-green-600">
                          정답: {r.question.correctAnswer}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={startQuiz}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                다시 도전
              </button>
              <Link
                href={`/vocabulary/${bookId}`}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors text-center"
              >
                단어장으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Quiz Question Screen
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

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
              ← 나가기
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-medium">{correctCount} 정답</span>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {questions.length}
              </span>
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
        {/* Question Type Indicator */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-white rounded-full text-sm text-gray-600 shadow-sm">
            {currentQuestion.type === 'korean_to_english'
              ? '한국어 → 영어'
              : '영어 → 한국어'}
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-2xl font-bold text-gray-900 text-center">
            {currentQuestion.type === 'korean_to_english'
              ? currentQuestion.item.korean_expression
              : currentQuestion.item.english_expression}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrect = option === currentQuestion.correctAnswer
            const showCorrect = showResult && isCorrect
            const showWrong = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                  showCorrect
                    ? 'bg-green-100 border-2 border-green-500'
                    : showWrong
                    ? 'bg-red-100 border-2 border-red-500'
                    : isSelected
                    ? 'bg-indigo-100 border-2 border-indigo-500'
                    : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium ${
                    showCorrect
                      ? 'bg-green-500 text-white'
                      : showWrong
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex-1 text-gray-900">{option}</span>
                {showCorrect && <span className="text-green-600">✓</span>}
                {showWrong && <span className="text-red-600">✗</span>}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        {showResult && (
          <div className="mt-6 text-center">
            <button
              onClick={nextQuestion}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              {currentIndex + 1 >= questions.length ? '결과 보기' : '다음 문제'} →
            </button>
            <div className="mt-2 text-xs text-gray-400">
              Enter 또는 Space로 계속
            </div>
          </div>
        )}

        {/* Keyboard Hint */}
        {!showResult && (
          <div className="mt-6 text-center text-xs text-gray-400">
            키보드 1, 2, 3, 4로 빠르게 선택
          </div>
        )}
      </main>
    </div>
  )
}
