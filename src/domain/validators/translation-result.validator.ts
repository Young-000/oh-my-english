import type { TranslationResult } from '../entities/translation'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
}

/**
 * 번역 결과 유효성 검증기
 * 1. 구조적 유효성 (필수 필드, 타입)
 * 2. 내용 품질 (빈 값, 최소 길이)
 * 3. 원어민 표현 검증 (직역 패턴 감지)
 */
export class TranslationResultValidator {
  // 흔한 직역 패턴 (피해야 할 표현들)
  private static readonly LITERAL_TRANSLATION_PATTERNS = [
    /^I am \w+ age$/i, // "나는 X살이야" 직역
    /^Please give me$/i, // "~주세요" 직역
    /^I will eat$/i, // "먹을게요" 직역
    /^Have you eaten\?$/i, // "밥 먹었어?" 너무 직역된 경우
    /^What is this\?$/i, // 문맥 없는 단순 직역
    /^I don't know\.$/i, // 너무 단순한 응답
  ]

  // 자연스러운 구어체 패턴
  private static readonly NATURAL_PATTERNS = [
    /^(What|How|Where|When|Who|Would|Could|Should|Do|Does|Did|Have|Has|Can|Will)/i,
    /\b(gonna|wanna|gotta|kinda|sorta)\b/i, // 구어체 축약
    /\b(pretty|really|quite|so|very)\b/i, // 강조 부사
    /(, right\?|, huh\?|, you know\?|, okay\?)$/i, // 구어체 어미
  ]

  // 유효한 formality 값들
  private static readonly VALID_FORMALITIES = ['casual', 'neutral', 'formal'] as const

  // 유효한 카테고리
  private static readonly VALID_CATEGORIES = [
    '일상대화',
    '육아',
    '비즈니스',
    '여행',
    '감정표현',
    '음식',
    '쇼핑',
    '건강',
  ] as const

  // 유효한 품사
  private static readonly VALID_PARTS_OF_SPEECH = [
    'noun',
    'verb',
    'adjective',
    'adverb',
    'preposition',
    'conjunction',
    'interjection',
    'pronoun',
  ] as const

  validate(result: TranslationResult): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // 1. 구조적 유효성 검증
    this.validateStructure(result, errors)

    // 2. 내용 품질 검증
    this.validateContentQuality(result, errors, warnings)

    // 3. 원어민 표현 검증
    this.validateNativeExpression(result, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private validateStructure(result: TranslationResult, errors: ValidationError[]): void {
    // mainExpression 필수
    if (!result.mainExpression) {
      errors.push({ field: 'mainExpression', message: 'mainExpression is required' })
      return
    }

    if (!result.mainExpression.english) {
      errors.push({ field: 'mainExpression.english', message: 'English expression is required' })
    }

    if (
      result.mainExpression.formality &&
      !TranslationResultValidator.VALID_FORMALITIES.includes(result.mainExpression.formality)
    ) {
      errors.push({
        field: 'mainExpression.formality',
        message: `Invalid formality: ${result.mainExpression.formality}. Must be one of: ${TranslationResultValidator.VALID_FORMALITIES.join(', ')}`,
      })
    }

    // explanation 검증
    if (!result.explanation) {
      errors.push({ field: 'explanation', message: 'explanation is required' })
    }

    // alternatives 배열 검증
    if (result.alternatives) {
      result.alternatives.forEach((alt, index) => {
        if (!alt.expression) {
          errors.push({
            field: `alternatives[${index}].expression`,
            message: 'Alternative expression is required',
          })
        }
      })
    }

    // relatedVocabulary 배열 검증
    if (result.relatedVocabulary) {
      result.relatedVocabulary.forEach((vocab, index) => {
        if (!vocab.word) {
          errors.push({
            field: `relatedVocabulary[${index}].word`,
            message: 'Vocabulary word is required',
          })
        }
        if (!vocab.meaning) {
          errors.push({
            field: `relatedVocabulary[${index}].meaning`,
            message: 'Vocabulary meaning is required',
          })
        }
        if (
          vocab.partOfSpeech &&
          !TranslationResultValidator.VALID_PARTS_OF_SPEECH.includes(
            vocab.partOfSpeech as (typeof TranslationResultValidator.VALID_PARTS_OF_SPEECH)[number]
          )
        ) {
          errors.push({
            field: `relatedVocabulary[${index}].partOfSpeech`,
            message: `Invalid part of speech: ${vocab.partOfSpeech}`,
          })
        }
      })
    }

    // category 검증
    if (
      result.category &&
      !TranslationResultValidator.VALID_CATEGORIES.includes(
        result.category as (typeof TranslationResultValidator.VALID_CATEGORIES)[number]
      )
    ) {
      errors.push({
        field: 'category',
        message: `Invalid category: ${result.category}. Must be one of: ${TranslationResultValidator.VALID_CATEGORIES.join(', ')}`,
      })
    }
  }

  private validateContentQuality(
    result: TranslationResult,
    errors: ValidationError[],
    warnings: string[]
  ): void {
    // 영어 표현 최소 길이
    if (result.mainExpression?.english && result.mainExpression.english.length < 2) {
      errors.push({
        field: 'mainExpression.english',
        message: 'English expression is too short',
      })
    }

    // 영어 표현이 실제 영어인지 확인 (한글 포함 여부)
    if (result.mainExpression?.english && /[가-힣]/.test(result.mainExpression.english)) {
      errors.push({
        field: 'mainExpression.english',
        message: 'English expression should not contain Korean characters',
      })
    }

    // explanation 품질
    if (result.explanation?.context && result.explanation.context.length < 10) {
      warnings.push('Context explanation is very short. Consider providing more detail.')
    }

    if (result.explanation?.nuance && result.explanation.nuance.length < 10) {
      warnings.push('Nuance explanation is very short. Consider providing more detail.')
    }

    // alternatives 수량
    if (!result.alternatives || result.alternatives.length === 0) {
      warnings.push('No alternative expressions provided. Consider adding 2-3 alternatives.')
    } else if (result.alternatives.length < 2) {
      warnings.push('Only one alternative provided. Consider adding more alternatives.')
    }

    // relatedVocabulary 수량
    if (!result.relatedVocabulary || result.relatedVocabulary.length === 0) {
      warnings.push('No related vocabulary provided. Consider adding 3-5 vocabulary items.')
    } else if (result.relatedVocabulary.length < 3) {
      warnings.push('Few vocabulary items provided. Consider adding more.')
    }

    // 예문 품질 검증
    result.relatedVocabulary?.forEach((vocab, index) => {
      if (!vocab.exampleSentence || vocab.exampleSentence.length < 5) {
        warnings.push(`Vocabulary item ${index + 1} lacks a proper example sentence.`)
      }
    })
  }

  private validateNativeExpression(result: TranslationResult, warnings: string[]): void {
    const expression = result.mainExpression?.english

    if (!expression) return

    // 직역 패턴 감지
    for (const pattern of TranslationResultValidator.LITERAL_TRANSLATION_PATTERNS) {
      if (pattern.test(expression)) {
        warnings.push(
          `Expression "${expression}" may be a literal translation. Consider more natural phrasing.`
        )
        break
      }
    }

    // 구어체 입력인데 너무 formal한 표현인지 체크
    if (result.mainExpression.formality === 'casual') {
      const hasNaturalPattern = TranslationResultValidator.NATURAL_PATTERNS.some((p) =>
        p.test(expression)
      )
      if (!hasNaturalPattern && expression.split(' ').length > 3) {
        // 짧은 표현은 제외
        warnings.push(
          'Casual expression might benefit from more conversational phrasing (contractions, etc.)'
        )
      }
    }

    // 대안 표현들도 검증
    result.alternatives?.forEach((alt, index) => {
      if (alt.expression === expression) {
        warnings.push(`Alternative ${index + 1} is identical to main expression.`)
      }
    })
  }

  /**
   * 간단한 유효성만 체크 (에러가 없으면 true)
   */
  isValid(result: TranslationResult): boolean {
    return this.validate(result).isValid
  }

  /**
   * 원어민 표현 점수 (0-100)
   * 높을수록 자연스러운 표현
   */
  calculateNativenessScore(result: TranslationResult): number {
    let score = 100
    const validation = this.validate(result)

    // 에러는 큰 감점
    score -= validation.errors.length * 20

    // 경고는 작은 감점
    score -= validation.warnings.length * 5

    // 구어체 자연스러움 보너스
    const expression = result.mainExpression?.english || ''
    if (TranslationResultValidator.NATURAL_PATTERNS.some((p) => p.test(expression))) {
      score += 10
    }

    // 충분한 대안 제공 보너스
    if (result.alternatives?.length >= 2) {
      score += 5
    }

    // 충분한 어휘 제공 보너스
    if (result.relatedVocabulary?.length >= 3) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }
}

export const translationResultValidator = new TranslationResultValidator()
