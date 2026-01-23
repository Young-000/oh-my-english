'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ArrowRight, Clock, Link2 } from 'lucide-react'
import type { Quiz, QuizResult, MatchingPair } from '@/domain/services/quiz-generator'

interface MatchingQuizCardProps {
  quiz: Quiz
  onSubmit: (userAnswer: string, timeTakenMs: number) => Promise<QuizResult>
  onNext: () => void
}

interface MatchedPair {
  pairId: string
  korean: string
  english: string
  colorClass: string
}

const PAIR_COLORS = [
  'bg-blue-100 border-blue-400 text-blue-800',
  'bg-green-100 border-green-400 text-green-800',
  'bg-purple-100 border-purple-400 text-purple-800',
  'bg-orange-100 border-orange-400 text-orange-800',
]

const LINE_COLORS = [
  'stroke-blue-400',
  'stroke-green-400',
  'stroke-purple-400',
  'stroke-orange-400',
]

export function MatchingQuizCard({ quiz, onSubmit, onNext }: MatchingQuizCardProps) {
  const [selectedKorean, setSelectedKorean] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Shuffle English options for display
  const shuffledEnglishOptions = useMemo(() => {
    if (!quiz.matchingPairs) return []
    const options = quiz.matchingPairs.map((pair) => ({
      pairId: pair.id,
      english: pair.english,
    }))
    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    return options
  }, [quiz.matchingPairs])

  // Timer effect
  useState(() => {
    if (result) return
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isKoreanMatched = useCallback(
    (pairId: string) => matchedPairs.some((mp) => mp.pairId === pairId),
    [matchedPairs]
  )

  const isEnglishMatched = useCallback(
    (english: string) => matchedPairs.some((mp) => mp.english === english),
    [matchedPairs]
  )

  const getMatchedPairColor = useCallback(
    (pairId: string) => {
      const index = matchedPairs.findIndex((mp) => mp.pairId === pairId)
      if (index >= 0) return PAIR_COLORS[index % PAIR_COLORS.length]
      return ''
    },
    [matchedPairs]
  )

  const getMatchedEnglishColor = useCallback(
    (english: string) => {
      const index = matchedPairs.findIndex((mp) => mp.english === english)
      if (index >= 0) return PAIR_COLORS[index % PAIR_COLORS.length]
      return ''
    },
    [matchedPairs]
  )

  const handleKoreanClick = useCallback(
    (pair: MatchingPair) => {
      if (result || isKoreanMatched(pair.id)) return
      setSelectedKorean(pair.id)
    },
    [result, isKoreanMatched]
  )

  const handleEnglishClick = useCallback(
    (english: string, _pairId: string) => {
      if (result || isEnglishMatched(english) || !selectedKorean) return

      const koreanPair = quiz.matchingPairs?.find((p) => p.id === selectedKorean)
      if (!koreanPair) return

      const newMatchedPair: MatchedPair = {
        pairId: selectedKorean,
        korean: koreanPair.korean,
        english,
        colorClass: PAIR_COLORS[matchedPairs.length % PAIR_COLORS.length],
      }

      setMatchedPairs((prev) => [...prev, newMatchedPair])
      setSelectedKorean(null)
    },
    [result, isEnglishMatched, selectedKorean, quiz.matchingPairs, matchedPairs.length]
  )

  const handleUnmatch = useCallback(
    (pairId: string) => {
      if (result) return
      setMatchedPairs((prev) => prev.filter((mp) => mp.pairId !== pairId))
    },
    [result]
  )

  const handleSubmit = useCallback(async () => {
    if (matchedPairs.length !== 4) return

    setIsSubmitting(true)
    try {
      const timeTakenMs = Date.now() - startTime
      // Format: "pair-0:english0,pair-1:english1,pair-2:english2,pair-3:english3"
      const userAnswer = matchedPairs
        .map((mp) => `${mp.pairId}:${mp.english}`)
        .sort((a, b) => a.localeCompare(b))
        .join(',')

      const quizResult = await onSubmit(userAnswer, timeTakenMs)
      setResult(quizResult)
    } finally {
      setIsSubmitting(false)
    }
  }, [matchedPairs, startTime, onSubmit])

  const handleNext = () => {
    setMatchedPairs([])
    setSelectedKorean(null)
    setResult(null)
    onNext()
  }

  // Check which pairs are correct after result
  const getResultStatus = useCallback(
    (pairId: string, matchedEnglish: string) => {
      if (!result) return null
      const correctPair = quiz.matchingPairs?.find((p) => p.id === pairId)
      if (!correctPair) return null
      return correctPair.english === matchedEnglish
    },
    [result, quiz.matchingPairs]
  )

  const renderKoreanColumn = () => (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-muted-foreground mb-1">한국어</div>
      {quiz.matchingPairs?.map((pair) => {
        const isMatched = isKoreanMatched(pair.id)
        const isSelected = selectedKorean === pair.id
        const matchedPair = matchedPairs.find((mp) => mp.pairId === pair.id)
        const resultStatus = matchedPair ? getResultStatus(pair.id, matchedPair.english) : null

        let statusClass = ''
        if (result && matchedPair) {
          statusClass = resultStatus
            ? 'bg-green-100 border-green-400 text-green-800'
            : 'bg-red-100 border-red-400 text-red-800'
        }

        return (
          <Button
            key={pair.id}
            variant="outline"
            className={`h-auto py-3 px-4 text-left justify-start border-2 transition-all ${
              isSelected
                ? 'ring-2 ring-primary ring-offset-2 border-primary'
                : isMatched
                  ? result
                    ? statusClass
                    : getMatchedPairColor(pair.id)
                  : 'hover:border-primary/50'
            }`}
            onClick={() => (isMatched ? handleUnmatch(pair.id) : handleKoreanClick(pair))}
            disabled={result !== null}
            data-testid={`korean-${pair.id}`}
          >
            <span className="text-sm">{pair.korean}</span>
          </Button>
        )
      })}
    </div>
  )

  const renderEnglishColumn = () => (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-muted-foreground mb-1">English</div>
      {shuffledEnglishOptions.map((option) => {
        const isMatched = isEnglishMatched(option.english)
        const matchedPair = matchedPairs.find((mp) => mp.english === option.english)
        const resultStatus = matchedPair
          ? getResultStatus(matchedPair.pairId, option.english)
          : null

        let statusClass = ''
        if (result && matchedPair) {
          statusClass = resultStatus
            ? 'bg-green-100 border-green-400 text-green-800'
            : 'bg-red-100 border-red-400 text-red-800'
        }

        return (
          <Button
            key={option.english}
            variant="outline"
            className={`h-auto py-3 px-4 text-left justify-start border-2 transition-all ${
              isMatched
                ? result
                  ? statusClass
                  : getMatchedEnglishColor(option.english)
                : selectedKorean
                  ? 'hover:border-primary/50 hover:bg-primary/5'
                  : ''
            }`}
            onClick={() => handleEnglishClick(option.english, option.pairId)}
            disabled={result !== null || isMatched || !selectedKorean}
            data-testid={`english-${option.pairId}`}
          >
            <span className="text-sm">{option.english}</span>
          </Button>
        )
      })}
    </div>
  )

  const renderConnectingLines = () => {
    if (matchedPairs.length === 0) return null

    return (
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          {matchedPairs.map((mp, index) => {
            const koreanEl = document.querySelector(`[data-testid="korean-${mp.pairId}"]`)
            const englishEl = document.querySelector(
              `[data-testid^="english-"]:has(span:contains("${mp.english}"))]`
            )

            if (!koreanEl || !englishEl) return null

            const koreanRect = koreanEl.getBoundingClientRect()
            const englishRect = englishEl.getBoundingClientRect()
            const containerRect = koreanEl.closest('.relative')?.getBoundingClientRect()

            if (!containerRect) return null

            const x1 = koreanRect.right - containerRect.left
            const y1 = koreanRect.top + koreanRect.height / 2 - containerRect.top
            const x2 = englishRect.left - containerRect.left
            const y2 = englishRect.top + englishRect.height / 2 - containerRect.top

            return (
              <line
                key={mp.pairId}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`${LINE_COLORS[index % LINE_COLORS.length]} stroke-2`}
                strokeDasharray={result && !getResultStatus(mp.pairId, mp.english) ? '5,5' : ''}
              />
            )
          })}
        </svg>
      </div>
    )
  }

  const renderMatchedIndicators = () => (
    <div className="flex items-center justify-center gap-2 mt-4">
      {[0, 1, 2, 3].map((index) => {
        const mp = matchedPairs[index]
        const isCorrect = mp ? getResultStatus(mp.pairId, mp.english) : null

        return (
          <div
            key={index}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
              mp
                ? result
                  ? isCorrect
                    ? 'bg-green-100 border-green-400'
                    : 'bg-red-100 border-red-400'
                  : PAIR_COLORS[index].replace('bg-', 'bg-').replace('text-', '')
                : 'border-gray-200'
            }`}
          >
            {mp && (
              <Link2
                className={`h-4 w-4 ${
                  result
                    ? isCorrect
                      ? 'text-green-600'
                      : 'text-red-600'
                    : 'text-gray-600'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderResult = () => {
    if (!result) return null

    return (
      <div
        className={`mt-4 p-4 rounded-lg ${
          result.isCorrect
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
        data-testid="quiz-result"
      >
        <div className="flex items-start gap-3">
          {result.isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600 shrink-0" />
          )}
          <div>
            <p className={`font-medium ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {result.feedback}
            </p>
            {!result.isCorrect && result.similarity !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                정확도: {Math.round(result.similarity * 100)}%
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            매칭
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span data-testid="quiz-timer">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-lg font-medium">{quiz.question}</p>
          <p className="text-sm text-muted-foreground mt-1">
            왼쪽의 한국어를 클릭한 후 오른쪽의 영어를 클릭하여 매칭하세요
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {renderKoreanColumn()}
            {renderEnglishColumn()}
          </div>
          {renderConnectingLines()}
        </div>

        {renderMatchedIndicators()}
        {renderResult()}

        <div className="flex justify-end pt-2">
          {!result ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || matchedPairs.length !== 4}
              data-testid="submit-button"
            >
              {isSubmitting ? '채점 중...' : matchedPairs.length === 4 ? '정답 확인' : `${matchedPairs.length}/4 매칭됨`}
            </Button>
          ) : (
            <Button onClick={handleNext} data-testid="next-button">
              다음 문제
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
