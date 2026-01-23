'use client'

import { useState, useCallback } from 'react'
import type { TranslationResult, LearningRecord } from '@/domain/entities/translation'
import type { TranslationContext } from '@/presentation/components/TranslationInput'

interface StreamingState {
  isLoading: boolean
  isStreaming: boolean
  streamingText: string
  progressMessage: string // 진행 상태 메시지
  result: {
    translationResult: TranslationResult
    learningRecord: LearningRecord
  } | null
  error: string | null
  isMockMode: boolean
  fromCache: boolean
  koreanInput: string
}

interface StreamEvent {
  type: 'chunk' | 'complete' | 'error' | 'progress'
  content?: string
  stage?: string
  message?: string
  translationResult?: TranslationResult
  learningRecord?: LearningRecord
  isMock?: boolean
  isLoggedIn?: boolean
  fromCache?: boolean
  cacheHits?: number
  error?: string
}

export function useStreamingTranslation() {
  const [state, setState] = useState<StreamingState>({
    isLoading: false,
    isStreaming: false,
    streamingText: '',
    progressMessage: '',
    result: null,
    error: null,
    isMockMode: false,
    fromCache: false,
    koreanInput: '',
  })

  const translate = useCallback(
    async (koreanInput: string, context: TranslationContext) => {
      setState({
        isLoading: true,
        isStreaming: true,
        streamingText: '',
        progressMessage: '번역 준비 중...',
        result: null,
        error: null,
        isMockMode: false,
        fromCache: false,
        koreanInput,
      })

      try {
        const response = await fetch('/api/translate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            koreanInput,
            target: context.target,
            situation: context.situation,
          }),
        })

        if (!response.ok) {
          throw new Error('Translation request failed')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE 이벤트 파싱
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6)) as StreamEvent

                if (event.type === 'progress' && event.message) {
                  setState((prev) => ({
                    ...prev,
                    progressMessage: event.message!,
                  }))
                } else if (event.type === 'chunk' && event.content) {
                  setState((prev) => ({
                    ...prev,
                    streamingText: prev.streamingText + event.content,
                  }))
                } else if (event.type === 'complete') {
                  setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    isStreaming: false,
                    result: {
                      translationResult: event.translationResult!,
                      learningRecord: event.learningRecord!,
                    },
                    isMockMode: event.isMock || false,
                    fromCache: event.fromCache || false,
                  }))
                } else if (event.type === 'error') {
                  throw new Error(event.error || 'Unknown error')
                }
              } catch (parseError) {
                console.error('Failed to parse SSE event:', parseError)
              }
            }
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isStreaming: false,
          error: error instanceof Error ? error.message : 'Something went wrong',
        }))
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isStreaming: false,
      streamingText: '',
      progressMessage: '',
      result: null,
      error: null,
      isMockMode: false,
      fromCache: false,
      koreanInput: '',
    })
  }, [])

  return {
    ...state,
    translate,
    reset,
  }
}
