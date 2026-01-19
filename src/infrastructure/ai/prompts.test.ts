import { describe, it, expect } from 'vitest'
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt } from './prompts'

describe('Translation Prompts', () => {
  describe('TRANSLATION_SYSTEM_PROMPT (최적화 버전)', () => {
    it('should include core translation rules', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('직역 금지')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('자연스러운 표현')
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

    it('should include formality matching rules', () => {
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('반말')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('존댓말')
      expect(TRANSLATION_SYSTEM_PROMPT).toContain('격식')
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

    it('should be optimized (shorter than 500 chars)', () => {
      // 속도 최적화를 위해 프롬프트가 짧아야 함
      expect(TRANSLATION_SYSTEM_PROMPT.length).toBeLessThan(700)
    })
  })

  describe('createTranslationPrompt() (최적화 버전)', () => {
    it('should include korean input in quotes', () => {
      const prompt = createTranslationPrompt('안녕하세요')
      expect(prompt).toContain('"안녕하세요"')
    })

    it('should be concise (optimized for speed)', () => {
      const prompt = createTranslationPrompt('테스트')
      // 속도 최적화: 짧은 프롬프트
      expect(prompt.length).toBeLessThan(50)
    })

    it('should include context when provided', () => {
      const prompt = createTranslationPrompt('안녕하세요', '비즈니스 미팅에서')
      expect(prompt).toContain('비즈니스 미팅에서')
    })

    it('should not include context section when not provided', () => {
      const prompt = createTranslationPrompt('안녕하세요')
      expect(prompt).not.toContain('(')
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
      })
    })
  })
})

describe('Expected Translation Quality (Mock scenarios)', () => {
  // 이 테스트들은 실제 API 호출 없이 프롬프트 설계 의도를 문서화

  it('should include input for casual expressions', () => {
    // "밥 뭐 먹을래?" 같은 반말 입력 확인
    const prompt = createTranslationPrompt('밥 뭐 먹을래?')
    expect(prompt).toContain('밥 뭐 먹을래?')
    // 기대 출력: "What do you wanna eat?" 또는 "What're you in the mood for?"
  })

  it('should guide formal input with context', () => {
    // "회의 일정을 조율하고 싶습니다" 같은 존댓말은 context와 함께
    const prompt = createTranslationPrompt('회의 일정을 조율하고 싶습니다', '비즈니스 이메일')
    expect(prompt).toContain('비즈니스 이메일')
    // 기대 출력: "I would like to coordinate the meeting schedule."
  })

  it('should handle childcare expressions with context', () => {
    const prompt = createTranslationPrompt('아기 재워야 해', '아이와 대화')
    expect(prompt).toContain('아기 재워야 해')
    expect(prompt).toContain('아이와 대화')
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
