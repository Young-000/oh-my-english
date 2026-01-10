'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuizSession, QuizResults, type SessionResult } from '@/presentation/components/QuizSession'
import { Brain, Clock, Target, ArrowLeft, Play } from 'lucide-react'
import type { LearningRecord } from '@/domain/entities/translation'

export default function QuizPage() {
  const router = useRouter()
  const [dueRecords, setDueRecords] = useState<LearningRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<'setup' | 'quiz' | 'results'>('setup')
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [selectedCount, setSelectedCount] = useState(5)

  useEffect(() => {
    const fetchDueRecords = async () => {
      try {
        const response = await fetch('/api/quiz/due')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch due records')
        }
        const data = await response.json()
        setDueRecords(data.records)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDueRecords()
  }, [router])

  const handleStartQuiz = () => {
    setSessionState('quiz')
  }

  const handleComplete = (results: SessionResult[]) => {
    setSessionResults(results)
    setSessionState('results')
  }

  const handleRestart = () => {
    setSessionResults([])
    setSessionState('quiz')
  }

  const handleHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => router.push('/')}>홈으로 돌아가기</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로
          </Button>
          <h1 className="text-xl font-bold">복습 퀴즈</h1>
          <div className="w-20" /> {/* Spacer */}
        </header>

        {sessionState === 'setup' && (
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  오늘의 복습
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">{dueRecords.length}</div>
                    <div className="text-sm text-muted-foreground">복습 대기</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-3xl font-bold">{selectedCount}</div>
                    <div className="text-sm text-muted-foreground">문제 수</div>
                  </div>
                </div>

                {dueRecords.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">문제 수 선택</label>
                      <div className="flex gap-2">
                        {[5, 10, 15, 20].map((count) => (
                          <Button
                            key={count}
                            variant={selectedCount === count ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCount(Math.min(count, dueRecords.length))}
                            disabled={count > dueRecords.length}
                          >
                            {count}문제
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleStartQuiz}>
                      <Play className="h-4 w-4 mr-2" />
                      퀴즈 시작
                    </Button>
                  </>
                )}

                {dueRecords.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <p className="text-lg font-medium">오늘의 복습을 모두 완료했어요!</p>
                    <p className="text-muted-foreground mt-2">
                      새로운 표현을 학습하러 가볼까요?
                    </p>
                    <Button className="mt-4" onClick={() => router.push('/')}>
                      새 표현 학습하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Due Records Preview */}
            {dueRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    복습 예정 표현
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dueRecords.slice(0, 10).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{record.koreanInput}</p>
                          <p className="text-xs text-muted-foreground">{record.englishExpression}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Lv.{record.masteryLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dueRecords.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground py-2">
                        외 {dueRecords.length - 10}개 더...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {sessionState === 'quiz' && (
          <QuizSession
            records={dueRecords.slice(0, selectedCount)}
            onComplete={handleComplete}
            onBack={() => setSessionState('setup')}
          />
        )}

        {sessionState === 'results' && (
          <QuizResults results={sessionResults} onRestart={handleRestart} onHome={handleHome} />
        )}
      </div>
    </div>
  )
}
