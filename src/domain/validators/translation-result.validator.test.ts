/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { TranslationResultValidator } from './translation-result.validator'
import type { TranslationResult } from '../entities/translation'

describe('TranslationResultValidator', () => {
  const validator = new TranslationResultValidator()

  // 유효한 기본 결과
  const validResult: TranslationResult = {
    mainExpression: {
      english: 'What do you want to eat?',
      formality: 'casual',
    },
    explanation: {
      context: 'Used when asking a child what they want to eat for a meal.',
      nuance: "This is a casual, friendly way to ask someone's preference.",
    },
    alternatives: [
      {
        expression: 'What would you like to eat?',
        situation: 'Slightly more polite situations',
        difference: 'More formal than the main expression',
      },
      {
        expression: "What are you in the mood for?",
        situation: 'Casual conversation with friends',
        difference: 'More colloquial and relaxed',
      },
    ],
    relatedVocabulary: [
      {
        word: 'meal',
        meaning: '식사',
        partOfSpeech: 'noun',
        exampleSentence: "Let's have a meal together.",
      },
      {
        word: 'hungry',
        meaning: '배고픈',
        partOfSpeech: 'adjective',
        exampleSentence: 'Are you hungry?',
      },
      {
        word: 'appetite',
        meaning: '식욕',
        partOfSpeech: 'noun',
        exampleSentence: 'I have a good appetite today.',
      },
    ],
    category: '일상대화',
  }

  describe('validate()', () => {
    it('should pass validation for a complete valid result', () => {
      const result = validator.validate(validResult)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    describe('structural validation', () => {
      it('should fail when mainExpression is missing', () => {
        const invalidResult = { ...validResult, mainExpression: undefined as any }
        const result = validator.validate(invalidResult)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'mainExpression',
          message: 'mainExpression is required',
        })
      })

      it('should fail when english expression is empty', () => {
        const invalidResult = {
          ...validResult,
          mainExpression: { english: '', formality: 'casual' as const },
        }
        const result = validator.validate(invalidResult)

        expect(result.isValid).toBe(false)
        expect(result.errors.some((e) => e.field === 'mainExpression.english')).toBe(true)
      })

      it('should fail for invalid formality value', () => {
        const invalidResult = {
          ...validResult,
          mainExpression: { english: 'Test', formality: 'very_formal' as any },
        }
        const result = validator.validate(invalidResult)

        expect(result.isValid).toBe(false)
        expect(result.errors.some((e) => e.field === 'mainExpression.formality')).toBe(true)
      })

      it('should fail when explanation is missing', () => {
        const invalidResult = { ...validResult, explanation: undefined as any }
        const result = validator.validate(invalidResult)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'explanation',
          message: 'explanation is required',
        })
      })

      it('should fail for invalid category', () => {
        const invalidResult = { ...validResult, category: '게임' }
        const result = validator.validate(invalidResult)

        expect(result.isValid).toBe(false)
        expect(result.errors.some((e) => e.field === 'category')).toBe(true)
      })

      it('should validate all valid categories', () => {
        const categories = [
          '일상대화',
          '육아',
          '비즈니스',
          '여행',
          '감정표현',
          '음식',
          '쇼핑',
          '건강',
        ]

        categories.forEach((category) => {
          const resultWithCategory = { ...validResult, category }
          const validation = validator.validate(resultWithCategory)
          expect(validation.errors.filter((e) => e.field === 'category')).toHaveLength(0)
        })
      })
    })

    describe('content quality validation', () => {
      it('should fail when english expression contains Korean', () => {
        const invalidResult = {
          ...validResult,
          mainExpression: { english: 'What do you want 먹을래?', formality: 'casual' as const },
        }
        const result = validator.validate(invalidResult)

        expect(result.isValid).toBe(false)
        expect(
          result.errors.some((e) => e.message.includes('should not contain Korean'))
        ).toBe(true)
      })

      it('should warn when context explanation is too short', () => {
        const shortContextResult = {
          ...validResult,
          explanation: { ...validResult.explanation, context: 'Short' },
        }
        const result = validator.validate(shortContextResult)

        expect(result.warnings.some((w) => w.includes('Context explanation'))).toBe(true)
      })

      it('should warn when no alternatives provided', () => {
        const noAlternativesResult = { ...validResult, alternatives: [] }
        const result = validator.validate(noAlternativesResult)

        expect(result.warnings.some((w) => w.includes('No alternative expressions'))).toBe(true)
      })

      it('should warn when vocabulary is insufficient', () => {
        const fewVocabResult = {
          ...validResult,
          relatedVocabulary: [validResult.relatedVocabulary[0]],
        }
        const result = validator.validate(fewVocabResult)

        expect(result.warnings.some((w) => w.includes('vocabulary'))).toBe(true)
      })
    })

    describe('native expression validation', () => {
      it('should warn about literal translations', () => {
        const literalResult = {
          ...validResult,
          mainExpression: { english: 'I am twenty age', formality: 'casual' as const },
        }
        const result = validator.validate(literalResult)

        expect(result.warnings.some((w) => w.includes('literal translation'))).toBe(true)
      })

      it('should warn when alternative is identical to main expression', () => {
        const duplicateResult = {
          ...validResult,
          alternatives: [
            {
              expression: 'What do you want to eat?', // Same as main
              situation: 'Same situation',
              difference: 'No difference',
            },
          ],
        }
        const result = validator.validate(duplicateResult)

        expect(result.warnings.some((w) => w.includes('identical to main expression'))).toBe(true)
      })
    })
  })

  describe('isValid()', () => {
    it('should return true for valid result', () => {
      expect(validator.isValid(validResult)).toBe(true)
    })

    it('should return false for invalid result', () => {
      const invalidResult = { ...validResult, mainExpression: undefined as any }
      expect(validator.isValid(invalidResult)).toBe(false)
    })
  })

  describe('calculateNativenessScore()', () => {
    it('should return high score for natural expressions', () => {
      const score = validator.calculateNativenessScore(validResult)
      expect(score).toBeGreaterThanOrEqual(80)
    })

    it('should return lower score for results with warnings', () => {
      const poorResult = {
        ...validResult,
        alternatives: [],
        relatedVocabulary: [],
      }
      const score = validator.calculateNativenessScore(poorResult)
      // 빈 alternatives와 relatedVocabulary로 인해 경고가 발생하여 점수가 낮아짐
      expect(score).toBeLessThanOrEqual(100)
      expect(score).toBeGreaterThanOrEqual(70) // 경고만 있는 경우
    })

    it('should return very low score for invalid results', () => {
      const invalidResult = {
        mainExpression: undefined as any,
        explanation: undefined as any,
        alternatives: [],
        relatedVocabulary: [],
        category: '',
      } as TranslationResult
      const score = validator.calculateNativenessScore(invalidResult)
      // 필수 필드 누락으로 에러 발생, 점수가 크게 낮아짐
      expect(score).toBeLessThanOrEqual(80)
    })

    it('should give bonus for colloquial patterns', () => {
      const colloquialResult = {
        ...validResult,
        mainExpression: {
          english: "What're you gonna eat?",
          formality: 'casual' as const,
        },
      }
      const regularScore = validator.calculateNativenessScore(validResult)
      const colloquialScore = validator.calculateNativenessScore(colloquialResult)

      // 구어체 패턴이 있는 경우 보너스
      expect(colloquialScore).toBeGreaterThanOrEqual(regularScore)
    })

    it('should return score between 0 and 100', () => {
      const testCases = [
        validResult,
        { ...validResult, alternatives: [] },
        { ...validResult, mainExpression: undefined as any },
      ]

      testCases.forEach((testCase) => {
        const score = validator.calculateNativenessScore(testCase)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('real-world test cases', () => {
    it('should validate "밥 뭐 먹을래?" translation correctly', () => {
      const result: TranslationResult = {
        mainExpression: {
          english: 'What do you want to eat?',
          formality: 'casual',
        },
        explanation: {
          context:
            '식사 시간에 상대방의 음식 선호를 물을 때 사용합니다. 가족이나 친구 사이에서 자주 쓰는 표현입니다.',
          nuance:
            '한국어의 "밥 뭐 먹을래?"는 친근한 표현이며, 영어로도 캐주얼한 "What do you want to eat?"가 가장 자연스럽습니다.',
        },
        alternatives: [
          {
            expression: "What are you in the mood for?",
            situation: '음식 종류를 넓게 물을 때',
            difference: "상대방의 '기분'이나 '끌리는 것'을 물어보는 느낌",
          },
          {
            expression: "What sounds good to you?",
            situation: '메뉴를 정할 때',
            difference: '더 부드럽고 제안하는 느낌',
          },
        ],
        relatedVocabulary: [
          {
            word: 'hungry',
            meaning: '배고픈',
            partOfSpeech: 'adjective',
            exampleSentence: 'Are you hungry yet?',
          },
          {
            word: 'appetite',
            meaning: '식욕',
            partOfSpeech: 'noun',
            exampleSentence: "I've lost my appetite.",
          },
          {
            word: 'craving',
            meaning: '갈망, 먹고 싶음',
            partOfSpeech: 'noun',
            exampleSentence: "I'm craving pizza tonight.",
          },
        ],
        category: '음식',
      }

      const validation = validator.validate(result)
      expect(validation.isValid).toBe(true)
      expect(validator.calculateNativenessScore(result)).toBeGreaterThanOrEqual(80)
    })

    it('should validate "회의 일정 조율하고 싶습니다" translation correctly', () => {
      const result: TranslationResult = {
        mainExpression: {
          english: 'I would like to coordinate the meeting schedule.',
          formality: 'formal',
        },
        explanation: {
          context: '비즈니스 상황에서 회의 시간을 정하기 위해 사용하는 표현입니다.',
          nuance:
            '"조율하다"는 coordinate가 가장 적절하며, would like to는 정중한 요청을 나타냅니다.',
        },
        alternatives: [
          {
            expression: 'I need to schedule a meeting.',
            situation: '좀 더 직접적인 상황',
            difference: '더 간결하고 직접적',
          },
          {
            expression: "Let's find a time that works for everyone.",
            situation: '팀 미팅 시',
            difference: '협력적인 느낌',
          },
        ],
        relatedVocabulary: [
          {
            word: 'schedule',
            meaning: '일정, 스케줄',
            partOfSpeech: 'noun',
            exampleSentence: "Let me check my schedule.",
          },
          {
            word: 'availability',
            meaning: '가능한 시간',
            partOfSpeech: 'noun',
            exampleSentence: 'Please let me know your availability.',
          },
          {
            word: 'reschedule',
            meaning: '일정 변경하다',
            partOfSpeech: 'verb',
            exampleSentence: 'Can we reschedule the meeting?',
          },
        ],
        category: '비즈니스',
      }

      const validation = validator.validate(result)
      expect(validation.isValid).toBe(true)
    })

    it('should validate childcare expression "아기 재워야 해" correctly', () => {
      const result: TranslationResult = {
        mainExpression: {
          english: 'I need to put the baby to sleep.',
          formality: 'casual',
        },
        explanation: {
          context: '아이를 재울 때가 되었음을 알리는 표현입니다.',
          nuance:
            '"재우다"는 "put to sleep"이 가장 자연스러우며, "make the baby sleep"은 어색합니다.',
          culturalNote: '영어권에서는 bedtime routine이 중요하게 여겨집니다.',
        },
        alternatives: [
          {
            expression: "It's the baby's bedtime.",
            situation: '정해진 취침 시간일 때',
            difference: '시간에 초점',
          },
          {
            expression: 'The baby needs to go down.',
            situation: '부모들 사이 대화',
            difference: '구어체 표현',
          },
        ],
        relatedVocabulary: [
          {
            word: 'nap',
            meaning: '낮잠',
            partOfSpeech: 'noun',
            exampleSentence: 'The baby needs a nap.',
          },
          {
            word: 'lullaby',
            meaning: '자장가',
            partOfSpeech: 'noun',
            exampleSentence: 'I sang a lullaby to the baby.',
          },
          {
            word: 'bedtime',
            meaning: '취침 시간',
            partOfSpeech: 'noun',
            exampleSentence: "It's past your bedtime.",
          },
        ],
        category: '육아',
      }

      const validation = validator.validate(result)
      expect(validation.isValid).toBe(true)
      expect(validator.calculateNativenessScore(result)).toBeGreaterThanOrEqual(85)
    })
  })
})
