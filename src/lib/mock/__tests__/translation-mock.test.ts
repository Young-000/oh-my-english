import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateMockTranslation, isMockMode } from '../translation-mock'
import type { TranslationResult } from '@/domain/entities/translation'

describe('Mock Translation', () => {
  describe('generateMockTranslation', () => {
    describe('키워드 매칭', () => {
      it('"밥" 키워드가 있으면 식사 관련 응답을 반환해야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'friend', 'casual')

        expect(result.mainExpression.english).toBeTruthy()
        expect(result.mainExpression.english.toLowerCase()).toMatch(/eat|meal|hungry/)
      })

      it('키워드가 없으면 기본 응답을 반환해야 한다', () => {
        const result = generateMockTranslation('안녕하세요', 'adult', 'casual')

        expect(result.mainExpression.english).toBeTruthy()
        expect(result.explanation.context).toBeTruthy()
      })
    })

    describe('Target 별 응답', () => {
      const targets = ['child', 'adult', 'colleague', 'boss', 'stranger', 'friend'] as const

      targets.forEach((target) => {
        it(`${target} 타겟에 대해 응답을 반환해야 한다`, () => {
          const result = generateMockTranslation('밥 먹었어?', target, 'casual')

          expect(result.mainExpression).toBeDefined()
          expect(result.explanation).toBeDefined()
          expect(result.alternatives).toBeDefined()
        })
      })

      it('child 타겟은 친근한 호칭이 포함될 수 있다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'child', 'casual')

        expect(result.mainExpression.english.toLowerCase()).toMatch(/sweetie|honey|dear|eaten|meal/)
      })

      it('boss 타겟은 존칭이 포함될 수 있다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'boss', 'casual')

        // sir/ma'am 또는 공손한 표현
        expect(result.mainExpression.formality).toMatch(/casual|neutral|formal/)
      })

      it('friend 타겟은 캐주얼한 표현이어야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'friend', 'casual')

        expect(result.mainExpression.formality).toBe('casual')
      })
    })

    describe('Situation 별 응답', () => {
      it('casual 상황은 casual formality를 반환해야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'adult', 'casual')

        expect(result.mainExpression.formality).toBe('casual')
        expect(result.category).toBe('daily')
      })

      it('formal 상황은 formal formality를 반환해야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'adult', 'formal')

        expect(result.mainExpression.formality).toBe('formal')
        expect(result.category).toBe('business')
      })
    })

    describe('응답 구조 검증', () => {
      it('TranslationResult 형식을 준수해야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'friend', 'casual')

        // mainExpression
        expect(result.mainExpression).toHaveProperty('english')
        expect(result.mainExpression).toHaveProperty('formality')
        expect(['casual', 'neutral', 'formal']).toContain(result.mainExpression.formality)

        // explanation
        expect(result.explanation).toHaveProperty('context')
        expect(result.explanation).toHaveProperty('nuance')

        // alternatives
        expect(Array.isArray(result.alternatives)).toBe(true)

        // relatedVocabulary
        expect(Array.isArray(result.relatedVocabulary)).toBe(true)

        // category
        expect(result.category).toBeDefined()
      })

      it('alternatives가 올바른 구조를 가져야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'adult', 'casual')

        if (result.alternatives.length > 0) {
          const alt = result.alternatives[0]
          expect(alt).toHaveProperty('expression')
          expect(alt).toHaveProperty('situation')
          expect(alt).toHaveProperty('difference')
        }
      })

      it('relatedVocabulary가 올바른 구조를 가져야 한다', () => {
        const result = generateMockTranslation('밥 먹었어?', 'adult', 'casual')

        if (result.relatedVocabulary.length > 0) {
          const vocab = result.relatedVocabulary[0]
          expect(vocab).toHaveProperty('word')
          expect(vocab).toHaveProperty('meaning')
          expect(vocab).toHaveProperty('partOfSpeech')
          expect(vocab).toHaveProperty('exampleSentence')
        }
      })
    })

    describe('기본 응답 fallback', () => {
      it('매칭되지 않는 입력은 기본 응답을 반환해야 한다', () => {
        const result = generateMockTranslation('알 수 없는 표현', 'adult', 'casual')

        expect(result.mainExpression.english).toBeTruthy()
        expect(result.explanation.context).toBeTruthy()
      })

      it('빈 입력도 기본 응답을 반환해야 한다', () => {
        const result = generateMockTranslation('', 'adult', 'casual')

        expect(result.mainExpression.english).toBeTruthy()
      })
    })

    describe('일관성 테스트', () => {
      it('같은 입력에 대해 일관된 응답을 반환해야 한다', () => {
        const result1 = generateMockTranslation('밥 먹었어?', 'friend', 'casual')
        const result2 = generateMockTranslation('밥 먹었어?', 'friend', 'casual')

        expect(result1.mainExpression.english).toBe(result2.mainExpression.english)
      })

      it('다른 target은 다른 응답을 반환해야 한다', () => {
        const childResult = generateMockTranslation('밥 먹었어?', 'child', 'casual')
        const bossResult = generateMockTranslation('밥 먹었어?', 'boss', 'casual')

        // 둘 다 밥 관련 응답이지만 표현이 다를 수 있음
        expect(childResult.mainExpression.english).not.toBe(bossResult.mainExpression.english)
      })
    })

    describe('모든 조합 테스트', () => {
      const targets = ['child', 'adult', 'colleague', 'boss', 'stranger', 'friend'] as const
      const situations = ['casual', 'formal'] as const

      targets.forEach((target) => {
        situations.forEach((situation) => {
          it(`${target} + ${situation} 조합이 유효한 응답을 반환해야 한다`, () => {
            const result = generateMockTranslation('밥 먹었어?', target, situation)

            expect(result.mainExpression.english).toBeTruthy()
            expect(result.mainExpression.english.length).toBeGreaterThan(0)
            expect(result.explanation.context).toBeTruthy()
          })
        })
      })
    })
  })

  describe('isMockMode', () => {
    // Note: isMockMode()는 서버 환경(typeof window === 'undefined')에서만 true를 반환합니다.
    // jsdom 환경에서는 window가 정의되어 있어 항상 false를 반환합니다.
    // 실제 서버 환경 테스트는 E2E 또는 통합 테스트에서 수행해야 합니다.

    it('클라이언트 환경(jsdom)에서는 항상 false를 반환해야 한다', () => {
      // jsdom 환경에서는 window가 정의되어 있음
      expect(typeof window).not.toBe('undefined')
      expect(isMockMode()).toBe(false)
    })

    it('isMockMode 함수가 존재해야 한다', () => {
      expect(typeof isMockMode).toBe('function')
    })
  })

  describe('edge cases', () => {
    it('한글이 포함된 긴 입력도 처리해야 한다', () => {
      const longInput = '오늘 정말 바쁜 하루였는데 밥은 제대로 먹었어요? 저는 점심도 못 먹었어요.'
      const result = generateMockTranslation(longInput, 'colleague', 'casual')

      expect(result.mainExpression.english).toBeTruthy()
    })

    it('특수문자가 포함된 입력도 처리해야 한다', () => {
      const input = '밥 먹었어?!?!'
      const result = generateMockTranslation(input, 'friend', 'casual')

      expect(result.mainExpression.english).toBeTruthy()
    })

    it('숫자가 포함된 입력도 처리해야 한다', () => {
      const input = '밥 3끼 다 먹었어?'
      const result = generateMockTranslation(input, 'adult', 'casual')

      expect(result.mainExpression.english).toBeTruthy()
    })
  })
})
