'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface StreamingResultProps {
  text: string
}

export function StreamingResult({ text }: StreamingResultProps) {
  // JSON 텍스트에서 영어 표현 추출 시도
  const extractMainExpression = (jsonText: string): string | null => {
    // "english": "..." 패턴 찾기
    const match = jsonText.match(/"english"\s*:\s*"([^"]+)"/)
    return match ? match[1] : null
  }

  const mainExpression = extractMainExpression(text)

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">AI가 번역 중...</span>
        </div>

        {mainExpression ? (
          <div className="space-y-4">
            {/* 메인 표현 - 이미 추출됨 */}
            <div className="text-2xl font-bold text-primary animate-pulse">
              {mainExpression}
            </div>

            {/* 원본 JSON 스트리밍 (디버그용, 숨김 가능) */}
            <div className="text-xs text-muted-foreground/50 font-mono bg-muted/30 p-3 rounded-lg max-h-32 overflow-hidden">
              <div className="animate-pulse">
                {text.slice(-200)}
                <span className="animate-ping">▌</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 아직 영어 표현이 추출되지 않음 */}
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="text-xs text-muted-foreground font-mono">
              <span className="animate-ping">▌</span> 응답 생성 중...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
