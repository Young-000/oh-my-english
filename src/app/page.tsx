'use client'

import { TranslationInput, type TranslationContext } from '@/presentation/components/TranslationInput'
import { TranslationResultCard } from '@/presentation/components/TranslationResult'
import { StreamingResult } from '@/presentation/components/StreamingResult'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, BookOpen, History, Brain, AlertCircle, Zap, Library } from 'lucide-react'
import Link from 'next/link'
import { useStreamingTranslation } from '@/presentation/hooks/useStreamingTranslation'

export default function Home() {
  const {
    isLoading,
    isStreaming,
    streamingText,
    progressMessage,
    result,
    error,
    isMockMode,
    fromCache,
    koreanInput,
    translate,
  } = useStreamingTranslation()

  const handleSubmit = async (koreanInput: string, context: TranslationContext) => {
    await translate(koreanInput, context)
  }

  const handleBookmark = async () => {
    if (!result) return
    // TODO: Implement bookmark toggle
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Oh My English!
            </h1>
            <Link
              href="/vocabulary"
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
            >
              <Library className="h-4 w-4" />
              단어장
            </Link>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            한국어를 입력하면 상황에 맞는 자연스러운 영어를 알려드려요
          </p>
        </header>

        {/* Input - 상단 배치 */}
        <Card className="mb-6 shadow-lg border-primary/20">
          <CardContent className="pt-6">
            <TranslationInput onSubmit={handleSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Mock Mode 알림 */}
        {isMockMode && result && (
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <span>테스트 모드: 실제 API 연결 시 더 정확한 결과를 받을 수 있어요</span>
          </div>
        )}

        {/* Cache Hit 알림 */}
        {fromCache && result && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <Zap className="h-4 w-4" />
            <span>캐시에서 즉시 로드됨</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Streaming / Loading */}
        {isLoading && (
          <div className="mb-6">
            {isStreaming && streamingText ? (
              <StreamingResult text={streamingText} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="animate-pulse space-y-4 w-full">
                  <div className="h-32 bg-muted rounded-lg" />
                  <div className="h-24 bg-muted rounded-lg" />
                </div>
                <p className="mt-4 text-sm">{progressMessage || '번역 준비 중...'}</p>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && !isLoading && (
          <TranslationResultCard
            result={result.translationResult}
            record={result.learningRecord}
            koreanInput={koreanInput}
            onBookmark={handleBookmark}
          />
        )}

        {/* Features (결과 없을 때만 표시) */}
        {!result && !isLoading && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 text-center">
              이런 것들을 도와드려요
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">자연스러운 표현</h3>
                    <p className="text-xs text-muted-foreground">원어민이 실제로 쓰는 표현</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">상황별 뉘앙스</h3>
                    <p className="text-xs text-muted-foreground">대상과 상황에 맞는 표현</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <History className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">학습 기록</h3>
                    <p className="text-xs text-muted-foreground">배운 표현을 자동 저장</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">스마트 복습</h3>
                    <p className="text-xs text-muted-foreground">간격 반복으로 기억 강화</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 예시 표현 (결과 없을 때) */}
        {!result && !isLoading && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">이런 걸 물어보세요</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['밥 먹었어?', '오늘 뭐해?', '조금만 기다려', '괜찮아?'].map((example) => (
                <Badge
                  key={example}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
