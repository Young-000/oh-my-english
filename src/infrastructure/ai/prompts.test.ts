import { describe, it, expect } from 'vitest'
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt } from './prompts'

describe('Translation Prompts', () => {
  describe('TRANSLATION_SYSTEM_PROMPT', () => {
    it('should include core principles', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('핵심 원칙')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('자연스러운 표현')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('직역 피하기')
    })

    it('should include contraction guidelines', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('축약형')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain("I'm")
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('gonna')
    })

    it('should include formality levels', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('casual')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('neutral')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('formal')
    })

    it('should include JSON format specification', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('mainExpression')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('explanation')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('alternatives')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('relatedVocabulary')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('category')
    })

    it('should include anti-literal translation examples', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('I want to eat rice')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('밥 먹었어')
    })

    it('should include quality checklist', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('품질 체크리스트')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('원어민')
    })

    it('should specify valid categories', () => {
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
      categories.forEach((cat) => {
        expect(TRANSLATION_SYSTEM_PROMPT).toContain(cat)
      })
    })
  })

  describe('createTranslationPrompt()', () => {
    it('should include korean input in quotes', () => {
      const prompt = createTranslationPrompt('안녕하세요')
      expect(prompt).toContain('"안녕하세요"')
    })

    it('should include instruction to use native expressions', () => {
      const prompt = createTranslationPrompt('테스트')
      expect(prompt).toContain('원어민')
    })

    it('should include context when provided', () => {
      const prompt = createTranslationPrompt('안녕하세요', '비즈니스 미팅에서')
      expect(prompt).toContain('상황/맥락: 비즈니스 미팅에서')
    })

    it('should not include context section when not provided', () => {
      const prompt = createTranslationPrompt('안녕하세요')
      expect(prompt).not.toContain('상황/맥락')
    })

    it('should handle various korean inputs', () => {
      const testCases = [
        '밥 뭐 먹을래?',
        '오늘 날씨 진짜 좋다!',
        '회의 일정 조율하고 싶습니다',
        '아기 재워야 해',
        '너무 피곤해서 쉬고 싶어',
      ]

      testCases.forEach((input) => {
        const prompt = createTranslationPrompt(input)
        expect(prompt).toContain(input)
        expect(prompt.length).toBeGreaterThan(input.length)
      })
    })
  })

  describe('Prompt Quality Guidelines', () => {
    it('should guide against common literal translation mistakes', () => {
      // 흔한 직역 실수에 대한 가이드라인이 포함되어야 함
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('Please give me water')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('Can I get some water')
    })

    it('should encourage colloquial expressions for casual input', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('wanna')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('gotta')
    })

    it('should include cultural context handling', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('culturalNote')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('문화적')
    })

    it('should specify formality matching', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('반말')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('존댓말')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('격식체')
    })
  })
})

describe('Expected Translation Quality (Mock scenarios)', () => {
  // 이 테스트들은 실제 API 호출 없이 프롬프트 설계 의도를 문서화

  it('should guide casual input to casual output', () => {
    // "밥 뭐 먹을래?" 같은 반말 입력은 casual 영어로
    const prompt = createTranslationPrompt('밥 뭐 먹을래?')
    expect(prompt).toContain('원어민')
    // 기대 출력: "What do you wanna eat?" 또는 "What're you in the mood for?"
  })

  it('should guide formal input to formal output', () => {
    // "회의 일정을 조율하고 싶습니다" 같은 존댓말은 formal 영어로
    const prompt = createTranslationPrompt('회의 일정을 조율하고 싶습니다', '비즈니스 이메일')
    expect(prompt).toContain('비즈니스 이메일')
    // 기대 출력: "I would like to coordinate the meeting schedule."
  })

  it('should handle childcare expressions naturally', () => {
    const prompt = createTranslationPrompt('아기 재워야 해', '아이와 대화')
    expect(prompt).toContain('아기 재워야 해')
    // 기대 출력: "I need to put the baby down" 또는 "It's time for the baby's nap"
  })

  it('should provide context-aware translations', () => {
    // 같은 표현도 맥락에 따라 다르게 번역
    const casualPrompt = createTranslationPrompt('고마워', '친구에게')
    const formalPrompt = createTranslationPrompt('감사합니다', '상사에게')

    expect(casualPrompt).toContain('친구에게')
    expect(formalPrompt).toContain('상사에게')
    // casual: "Thanks!" 또는 "Thanks, man!"
    // formal: "Thank you very much." 또는 "I really appreciate it."
  })
})
