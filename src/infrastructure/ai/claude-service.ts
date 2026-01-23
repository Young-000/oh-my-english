import Anthropic from '@anthropic-ai/sdk';
import type { ITranslationService, TranslationRequest } from '@/domain/repositories/translation-service';
import type { TranslationResult } from '@/domain/entities/translation';
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt } from './prompts';
import { ParseError } from '@/domain/errors/translation-errors';

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
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: TRANSLATION_SYSTEM_PROMPT,
    })

    const content = response.content[0];
    if (content.type !== 'text') {
      throw ParseError.unexpectedResponseType('text', content.type);
    }

    return this.parseResponse(content.text);
  }

  /**
   * 스트리밍 번역 - 텍스트 청크를 실시간으로 전달
   */
  async *translateStream(
    request: TranslationRequest
  ): AsyncGenerator<string, TranslationResult, unknown> {
    const userPrompt = createTranslationPrompt(request.koreanInput, request.context)

    const stream = this.client.messages.stream({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
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
      let jsonText = text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '');
        jsonText = jsonText.replace(/\n?```$/, '');
      }

      const result = JSON.parse(jsonText) as TranslationResult;
      return this.validateAndNormalize(result);
    } catch (error) {
      // JSON 파싱 실패인지 검증 실패인지 구분
      if (error instanceof ParseError) {
        throw error;
      }
      throw ParseError.jsonParseFailed(text, error instanceof Error ? error : undefined);
    }
  }

  private validateAndNormalize(result: TranslationResult): TranslationResult {
    // 필수 필드 검증
    if (!result.mainExpression?.english) {
      throw ParseError.missingRequiredFields(['mainExpression.english']);
    }

    // 관련 어휘 정규화 - 잘못된 형식 필터링
    const normalizedVocabulary = (result.relatedVocabulary || [])
      .filter(vocab => vocab && typeof vocab === 'object')
      .map(vocab => ({
        word: vocab.word || '',
        partOfSpeech: vocab.partOfSpeech || 'noun',
        meaning: vocab.meaning || '',
        exampleSentence: vocab.exampleSentence || '',
      }))
      .filter(vocab => vocab.word && vocab.word !== '-' && vocab.meaning);

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
      relatedVocabulary: normalizedVocabulary,
      category: result.category || '일상대화',
    }
  }
}
