'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark, BookOpen, RefreshCw, Volume2 } from 'lucide-react'
import type { TranslationResult, LearningRecord } from '@/domain/entities/translation'

interface TranslationResultProps {
  result: TranslationResult
  record?: LearningRecord
  onBookmark?: () => void
  onPractice?: () => void
}

const formalityLabels = {
  casual: '캐주얼',
  neutral: '중립',
  formal: '격식',
} as const

const formalityColors = {
  casual: 'bg-green-100 text-green-800',
  neutral: 'bg-blue-100 text-blue-800',
  formal: 'bg-purple-100 text-purple-800',
} as const

export function TranslationResultCard({
  result,
  record,
  onBookmark,
  onPractice,
}: TranslationResultProps) {
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(result.mainExpression.english)
      utterance.lang = 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="space-y-4">
      {/* 메인 표현 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-2xl font-semibold text-primary">
                {result.mainExpression.english}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    formalityColors[result.mainExpression.formality]
                  }`}
                >
                  {formalityLabels[result.mainExpression.formality]}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {result.category}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handleSpeak} title="발음 듣기">
                <Volume2 className="h-4 w-4" />
              </Button>
              {onBookmark && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBookmark}
                  title="북마크"
                  className={record?.isBookmarked ? 'text-yellow-500' : ''}
                >
                  <Bookmark className="h-4 w-4" fill={record?.isBookmarked ? 'currentColor' : 'none'} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">언제 사용하나요?</h4>
            <p className="text-sm">{result.explanation.context}</p>
          </div>
          {result.explanation.nuance && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">뉘앙스</h4>
              <p className="text-sm">{result.explanation.nuance}</p>
            </div>
          )}
          {result.explanation.culturalNote && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">문화적 참고</h4>
              <p className="text-sm text-orange-700">{result.explanation.culturalNote}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 대안 표현 */}
      {result.alternatives.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              다른 표현들
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.alternatives.map((alt, index) => (
              <div key={index} className="border-l-2 border-primary/30 pl-3">
                <p className="font-medium text-primary">{alt.expression}</p>
                <p className="text-sm text-muted-foreground">{alt.situation}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  차이점: {alt.difference}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 관련 어휘 */}
      {result.relatedVocabulary.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              관련 어휘
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {result.relatedVocabulary.map((vocab, index) => (
                <div key={index} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{vocab.word}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                      {vocab.partOfSpeech}
                    </span>
                    <span className="text-muted-foreground">- {vocab.meaning}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    &ldquo;{vocab.exampleSentence}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      {onPractice && (
        <div className="flex justify-center">
          <Button onClick={onPractice} className="w-full max-w-xs">
            바로 연습하기
          </Button>
        </div>
      )}
    </div>
  )
}
