import Anthropic from '@anthropic-ai/sdk'
import type { ITranslationService, TranslationRequest } from '@/domain/repositories/translation-service'
import type { TranslationResult } from '@/domain/entities/translation'
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt } from './prompts'

export class ClaudeTranslationService implements ITranslationService {
  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    })
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const userPrompt = createTranslationPrompt(request.koreanInput, request.context)

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: TRANSLATION_SYSTEM_PROMPT,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API')
    }

    return this.parseResponse(content.text)
  }

  /**
   * 스트리밍 번역 - 텍스트 청크를 실시간으로 전달
   */
  async *translateStream(
    request: TranslationRequest
  ): AsyncGenerator<string, TranslationResult, unknown> {
    const userPrompt = createTranslationPrompt(request.koreanInput, request.context)

    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: TRANSLATION_SYSTEM_PROMPT,
    })

    let fullText = ''

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const chunk = event.delta.text
        fullText += chunk
        yield chunk
      }
    }

    // 스트림 완료 후 파싱된 결과 반환
    return this.parseResponse(fullText)
  }

  /**
   * Claude 응답 텍스트를 파싱
   */
  private parseResponse(text: string): TranslationResult {
    try {
      // Markdown 코드 블록 제거 (```json ... ``` 형식 처리)
      let jsonText = text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '')
        jsonText = jsonText.replace(/\n?```$/, '')
      }

      const result = JSON.parse(jsonText) as TranslationResult
      return this.validateAndNormalize(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to parse Claude response: ${errorMessage}`)
    }
  }

  private validateAndNormalize(result: TranslationResult): TranslationResult {
    // 필수 필드 검증
    if (!result.mainExpression?.english) {
      throw new Error('Missing mainExpression.english in response')
    }

    // 기본값 설정
    return {
      mainExpression: {
        english: result.mainExpression.english,
        formality: result.mainExpression.formality || 'neutral',
      },
      explanation: {
        context: result.explanation?.context || '',
        nuance: result.explanation?.nuance || '',
        culturalNote: result.explanation?.culturalNote,
      },
      alternatives: result.alternatives || [],
      relatedVocabulary: result.relatedVocabulary || [],
      category: result.category || '일상대화',
    }
  }
}
