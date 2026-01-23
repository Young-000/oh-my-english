'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, HelpCircle, ArrowRight, Clock, Volume2, X, RotateCcw } from 'lucide-react'
import type { Quiz, QuizResult } from '@/domain/services/quiz-generator'
import { MatchingQuizCard } from './MatchingQuizCard'

interface QuizCardProps {
  quiz: Quiz
  onSubmit: (userAnswer: string, timeTakenMs: number) => Promise<QuizResult>
  onNext: () => void
}

export function QuizCard({ quiz, onSubmit, onNext }: QuizCardProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  // Sentence ordering state
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [availableWords, setAvailableWords] = useState<string[]>([])

  // Initialize sentence ordering words
  useEffect(() => {
    if (quiz.type === 'sentence_ordering' && quiz.scrambledWords) {
      setAvailableWords([...quiz.scrambledWords])
      setSelectedWords([])
    }
  }, [quiz.type, quiz.scrambledWords])

  useEffect(() => {
    if (result) return
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, result])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playAudio = useCallback(() => {
    if (!quiz.audioText || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    // 이미 재생 중이면 중지
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(quiz.audioText)
    utterance.lang = 'en-US'
    utterance.rate = 0.9 // 약간 느리게 재생

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }, [quiz.audioText, isPlaying])

  const handleSubmit = useCallback(async () => {
    let answer: string | null = null

    if (quiz.type === 'multiple_choice' || quiz.type === 'listening') {
      answer = selectedOption
    } else if (quiz.type === 'sentence_ordering') {
      answer = selectedWords.join(' ')
    } else {
      answer = userAnswer
    }

    if (!answer?.trim()) return

    setIsSubmitting(true)
    try {
      const timeTakenMs = Date.now() - startTime
      const quizResult = await onSubmit(answer.trim(), timeTakenMs)
      setResult(quizResult)
    } finally {
      setIsSubmitting(false)
    }
  }, [quiz.type, selectedOption, userAnswer, selectedWords, startTime, onSubmit])

  const handleNext = () => {
    setUserAnswer('')
    setSelectedOption(null)
    setResult(null)
    setShowHint(false)
    onNext()
  }

  const renderQuestion = () => {
    switch (quiz.type) {
      case 'korean_to_english':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-xl font-medium">{quiz.question}</p>
              <p className="text-sm text-muted-foreground mt-2">이 표현을 영어로 번역하세요</p>
            </div>
            <Input
              placeholder="영어로 입력하세요..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleSubmit()}
              disabled={!!result || isSubmitting}
              className="text-lg"
              data-testid="quiz-input"
            />
          </div>
        )

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-lg whitespace-pre-line">{quiz.question}</p>
              <p className="text-sm text-muted-foreground mt-2">빈칸에 들어갈 단어를 입력하세요</p>
            </div>
            <Input
              placeholder="단어를 입력하세요..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleSubmit()}
              disabled={!!result || isSubmitting}
              className="text-lg text-center"
              data-testid="quiz-input"
            />
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-xl font-medium">{quiz.question}</p>
              <p className="text-sm text-muted-foreground mt-2">올바른 영어 표현을 선택하세요</p>
            </div>
            <div className="grid gap-2">
              {quiz.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? 'default' : 'outline'}
                  className={`justify-start text-left h-auto py-3 px-4 ${
                    result
                      ? option === quiz.correctAnswer
                        ? 'bg-green-100 border-green-500 text-green-800 hover:bg-green-100'
                        : selectedOption === option
                          ? 'bg-red-100 border-red-500 text-red-800 hover:bg-red-100'
                          : ''
                      : ''
                  }`}
                  onClick={() => !result && setSelectedOption(option)}
                  disabled={!!result || isSubmitting}
                  data-testid={`quiz-option-${index}`}
                >
                  <span className="mr-2 font-medium">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'listening':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-lg font-medium mb-4">{quiz.question}</p>
              <Button
                variant="outline"
                size="lg"
                onClick={playAudio}
                className={`gap-2 ${isPlaying ? 'bg-primary text-primary-foreground' : ''}`}
                data-testid="play-audio-button"
              >
                <Volume2 className={`h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                {isPlaying ? '재생 중...' : '발음 듣기'}
              </Button>
              {result && quiz.audioText && (
                <p className="mt-4 text-lg font-medium text-primary">
                  &quot;{quiz.audioText}&quot;
                </p>
              )}
            </div>
            <div className="grid gap-2">
              {quiz.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? 'default' : 'outline'}
                  className={`justify-start text-left h-auto py-3 px-4 ${
                    result
                      ? option === quiz.correctAnswer
                        ? 'bg-green-100 border-green-500 text-green-800 hover:bg-green-100'
                        : selectedOption === option
                          ? 'bg-red-100 border-red-500 text-red-800 hover:bg-red-100'
                          : ''
                      : ''
                  }`}
                  onClick={() => !result && setSelectedOption(option)}
                  disabled={!!result || isSubmitting}
                  data-testid={`quiz-option-${index}`}
                >
                  <span className="mr-2 font-medium">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'sentence_ordering':
        return (
          <div className="space-y-4">
            {/* Question */}
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-xl font-medium">{quiz.question}</p>
              <p className="text-sm text-muted-foreground mt-2">단어를 올바른 순서로 배열하세요</p>
            </div>

            {/* Selected words area (answer being built) */}
            <div className="min-h-[60px] p-4 bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg">
              {selectedWords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedWords.map((word, index) => (
                    <Button
                      key={`selected-${index}`}
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (!result) {
                          // Remove word from selected and add back to available
                          const newSelected = [...selectedWords]
                          newSelected.splice(index, 1)
                          setSelectedWords(newSelected)
                          setAvailableWords([...availableWords, word])
                        }
                      }}
                      disabled={!!result || isSubmitting}
                      className="gap-1"
                      data-testid={`selected-word-${index}`}
                    >
                      {word}
                      {!result && <X className="h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  아래 단어를 클릭하여 문장을 만드세요
                </p>
              )}
            </div>

            {/* Available words to select */}
            <div className="flex flex-wrap gap-2 justify-center">
              {availableWords.map((word, index) => (
                <Button
                  key={`available-${index}`}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!result) {
                      // Add word to selected and remove from available
                      setSelectedWords([...selectedWords, word])
                      const newAvailable = [...availableWords]
                      newAvailable.splice(index, 1)
                      setAvailableWords(newAvailable)
                    }
                  }}
                  disabled={!!result || isSubmitting}
                  data-testid={`available-word-${index}`}
                >
                  {word}
                </Button>
              ))}
            </div>

            {/* Reset button */}
            {selectedWords.length > 0 && !result && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (quiz.scrambledWords) {
                      setAvailableWords([...quiz.scrambledWords])
                      setSelectedWords([])
                    }
                  }}
                  className="text-muted-foreground"
                  data-testid="reset-words-button"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  다시 시작
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

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
            {!result.isCorrect && (
              <p className="text-sm text-muted-foreground mt-1">
                정답: <span className="font-medium text-foreground">{quiz.correctAnswer}</span>
              </p>
            )}
            {result.similarity !== undefined && result.similarity < 1 && result.similarity > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                유사도: {Math.round(result.similarity * 100)}%
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Delegate matching quizzes to specialized component (after all hooks)
  if (quiz.type === 'matching') {
    return <MatchingQuizCard quiz={quiz} onSubmit={onSubmit} onNext={onNext} />
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {quiz.type === 'korean_to_english' && '한→영 번역'}
            {quiz.type === 'fill_blank' && '빈칸 채우기'}
            {quiz.type === 'multiple_choice' && '객관식'}
            {quiz.type === 'listening' && '듣기'}
            {quiz.type === 'sentence_ordering' && '문장 순서 배열'}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span data-testid="quiz-timer">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderQuestion()}
        {renderResult()}

        <div className="flex items-center justify-between pt-2">
          {quiz.hint && !result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              힌트
            </Button>
          )}
          {showHint && quiz.hint && !result && (
            <p className="text-sm text-muted-foreground flex-1 text-center">
              💡 {quiz.hint}
            </p>
          )}
          <div className="ml-auto">
            {!result ? (
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (quiz.type === 'multiple_choice' || quiz.type === 'listening'
                    ? !selectedOption
                    : quiz.type === 'sentence_ordering'
                      ? selectedWords.length === 0 || availableWords.length > 0
                      : !userAnswer.trim())
                }
                data-testid="submit-button"
              >
                {isSubmitting ? '채점 중...' : '정답 확인'}
              </Button>
            ) : (
              <Button onClick={handleNext} data-testid="next-button">
                다음 문제
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
