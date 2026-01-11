'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

// 대상 옵션
const TARGET_OPTIONS = [
  { value: 'child', label: '아이에게', emoji: '👶' },
  { value: 'adult', label: '어른에게', emoji: '🧑' },
  { value: 'colleague', label: '동료에게', emoji: '👥' },
  { value: 'boss', label: '상사에게', emoji: '👔' },
  { value: 'stranger', label: '처음 보는 사람', emoji: '🙋' },
  { value: 'friend', label: '친구에게', emoji: '🤝' },
] as const

// 상황 옵션
const SITUATION_OPTIONS = [
  { value: 'casual', label: '캐주얼', description: '편하게, 일상적으로', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'formal', label: '포멀', description: '공식적으로, 격식있게', color: 'bg-purple-100 text-purple-700 border-purple-200' },
] as const

export type TargetType = typeof TARGET_OPTIONS[number]['value']
export type SituationType = typeof SITUATION_OPTIONS[number]['value']

export interface TranslationContext {
  target: TargetType
  situation: SituationType
}

interface TranslationInputProps {
  onSubmit: (input: string, context: TranslationContext) => void
  isLoading: boolean
}

export function TranslationInput({ onSubmit, isLoading }: TranslationInputProps) {
  const [input, setInput] = useState('')
  const [target, setTarget] = useState<TargetType>('adult')
  const [situation, setSituation] = useState<SituationType>('casual')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSubmit(input.trim(), { target, situation })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 입력창 */}
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="영어로 표현하고 싶은 한국어를 입력하세요..."
          className="min-h-[80px] pr-12 resize-none text-base"
          disabled={isLoading}
          maxLength={500}
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 bottom-2"
          disabled={!input.trim() || isLoading}
          aria-label={isLoading ? '번역 중' : '번역하기'}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 대상 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">누구에게?</label>
        <div className="flex flex-wrap gap-2">
          {TARGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTarget(option.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                target === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              )}
            >
              <span className="mr-1">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 상황 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">어떤 상황?</label>
        <div className="flex gap-2">
          {SITUATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSituation(option.value)}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2',
                situation === option.value
                  ? option.color
                  : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50'
              )}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs opacity-80">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{input.length}/500</span>
        <span>Enter로 번역 · Shift+Enter로 줄바꿈</span>
      </div>
    </form>
  )
}
