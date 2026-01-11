'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuizCard } from './QuizCard'
import { Trophy, Target, Clock, ArrowLeft, RefreshCw } from 'lucide-react'
import type { Quiz, QuizResult } from '@/domain/services/quiz-generator'
import type { LearningRecord } from '@/domain/entities/translation'

interface QuizSessionProps {
  records: LearningRecord[]
  onComplete: (results: SessionResult[]) => void
  onBack: () => void
}

export interface SessionResult {
  recordId: string
  quiz: Quiz
  result: QuizResult
  timeTakenMs: number
}

export function QuizSession({ records, onComplete, onBack }: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 최신 결과를 저장하는 ref (클로저 문제 해결)
  const latestResultsRef = useRef<SessionResult[]>([])

  // 퀴즈 생성
  useEffect(() => {
    const generateQuizzes = async () => {
      try {
        const response = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordIds: records.map((r) => r.id) }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate quizzes')
        }

        const data = await response.json()
        setQuizzes(data.quizzes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quizzes')
      } finally {
        setIsLoading(false)
      }
    }

    if (records.length > 0) {
      generateQuizzes()
    }
  }, [records])

  const handleSubmit = useCallback(
    async (userAnswer: string, timeTakenMs: number): Promise<QuizResult> => {
      const currentQuiz = quizzes[currentIndex]

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: currentQuiz.recordId,
          quizType: currentQuiz.type,
          question: currentQuiz.question,
          userAnswer,
          correctAnswer: currentQuiz.correctAnswer,
          timeTakenMs,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const data = await response.json()
      const result = data.quizResult

      const newResult: SessionResult = {
        recordId: currentQuiz.recordId,
        quiz: currentQuiz,
        result,
        timeTakenMs,
      }

      // 새 결과를 포함한 배열 생성 (race condition 방지)
      const updatedResults = [...sessionResults, newResult]
      setSessionResults(updatedResults)

      // ref에 최신 결과 저장 (handleNext에서 사용)
      latestResultsRef.current = updatedResults

      return result
    },
    [quizzes, currentIndex, sessionResults]
  )

  const handleNext = useCallback(() => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // 마지막 퀴즈: ref에서 최신 결과 사용
      onComplete(latestResultsRef.current.length > 0 ? latestResultsRef.current : sessionResults)
    }
  }, [currentIndex, quizzes.length, sessionResults, onComplete])

  if (isLoading) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-muted-foreground">퀴즈를 준비하고 있습니다...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizzes.length === 0) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">복습할 표현이 없습니다.</p>
            <Button onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progress = ((currentIndex + 1) / quizzes.length) * 100
  const correctCount = sessionResults.filter((r) => r.result.isCorrect).length

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              나가기
            </Button>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4 text-primary" />
                {currentIndex + 1} / {quizzes.length}
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <Trophy className="h-4 w-4" />
                {correctCount}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Quiz */}
      <QuizCard
        key={currentIndex}
        quiz={quizzes[currentIndex]}
        onSubmit={handleSubmit}
        onNext={handleNext}
      />
    </div>
  )
}

interface QuizResultsProps {
  results: SessionResult[]
  onRestart: () => void
  onHome: () => void
}

export function QuizResults({ results, onRestart, onHome }: QuizResultsProps) {
  const correctCount = results.filter((r) => r.result.isCorrect).length
  const totalTime = results.reduce((sum, r) => sum + r.timeTakenMs, 0)
  const accuracy = Math.round((correctCount / results.length) * 100)

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  const getAccuracyMessage = () => {
    if (accuracy >= 90) return { emoji: '🎉', message: '완벽해요!' }
    if (accuracy >= 70) return { emoji: '👏', message: '잘했어요!' }
    if (accuracy >= 50) return { emoji: '💪', message: '조금만 더 연습해요!' }
    return { emoji: '📚', message: '복습이 필요해요!' }
  }

  const { emoji, message } = getAccuracyMessage()

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <CardTitle className="text-2xl">{message}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-primary">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">정확도</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-muted-foreground">정답</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{results.length}</div>
            <div className="text-sm text-muted-foreground">문제</div>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>총 소요 시간: {formatTime(totalTime)}</span>
        </div>

        {/* Results List */}
        <div className="space-y-2">
          <h4 className="font-medium">문제별 결과</h4>
          {results.map((r, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                r.result.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {r.result.isCorrect ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.quiz.question}</p>
                  {!r.result.isCorrect && (
                    <p className="text-xs text-muted-foreground mt-1">
                      정답: {r.quiz.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onHome} className="flex-1">
            홈으로
          </Button>
          <Button onClick={onRestart} className="flex-1">
            다시 도전
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
