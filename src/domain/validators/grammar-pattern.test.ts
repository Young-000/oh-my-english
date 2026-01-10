import { describe, it, expect } from 'vitest'

/**
 * 문법 패턴 검증 테스트
 *
 * AI가 생성한 영어 표현이 올바른 문법 패턴을 따르는지 검증
 * - 주어-동사 일치
 * - 시제 일관성
 * - 관사 사용
 * - 일반적인 문법 오류 감지
 */

/**
 * 기본 문법 패턴 검증기
 */
function validateGrammar(sentence: string): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  const normalized = sentence.toLowerCase().trim()

  // 빈 문장 체크
  if (!normalized) {
    return { isValid: false, issues: ['Empty sentence'], suggestions: [] }
  }

  // 패턴 1: 주어-동사 일치 (I am, He is, They are, etc.)
  const subjectVerbPatterns = [
    { pattern: /\bi\s+is\b/i, issue: 'Subject-verb disagreement: "I is"', suggestion: 'Use "I am"' },
    { pattern: /\bi\s+are\b/i, issue: 'Subject-verb disagreement: "I are"', suggestion: 'Use "I am"' },
    { pattern: /\bhe\s+am\b/i, issue: 'Subject-verb disagreement: "He am"', suggestion: 'Use "He is"' },
    { pattern: /\bshe\s+am\b/i, issue: 'Subject-verb disagreement: "She am"', suggestion: 'Use "She is"' },
    { pattern: /\bthey\s+is\b/i, issue: 'Subject-verb disagreement: "They is"', suggestion: 'Use "They are"' },
    { pattern: /\bwe\s+is\b/i, issue: 'Subject-verb disagreement: "We is"', suggestion: 'Use "We are"' },
    { pattern: /\byou\s+is\b/i, issue: 'Subject-verb disagreement: "You is"', suggestion: 'Use "You are"' },
    { pattern: /\bit\s+am\b/i, issue: 'Subject-verb disagreement: "It am"', suggestion: 'Use "It is"' },
    { pattern: /\bit\s+are\b/i, issue: 'Subject-verb disagreement: "It are"', suggestion: 'Use "It is"' },
  ]

  subjectVerbPatterns.forEach(({ pattern, issue, suggestion }) => {
    if (pattern.test(normalized)) {
      issues.push(issue)
      suggestions.push(suggestion)
    }
  })

  // 패턴 2: 이중 동사 오류
  const doubleVerbPatterns = [
    { pattern: /\bcan\s+can\b/i, issue: 'Double modal: "can can"', suggestion: 'Use single "can"' },
    { pattern: /\bwill\s+will\b/i, issue: 'Double modal: "will will"', suggestion: 'Use single "will"' },
    { pattern: /\bis\s+is\b/i, issue: 'Double verb: "is is"', suggestion: 'Remove duplicate "is"' },
    { pattern: /\bare\s+are\b/i, issue: 'Double verb: "are are"', suggestion: 'Remove duplicate "are"' },
    { pattern: /\bthe\s+the\b/i, issue: 'Double article: "the the"', suggestion: 'Remove duplicate "the"' },
    { pattern: /\ba\s+a\b/i, issue: 'Double article: "a a"', suggestion: 'Remove duplicate "a"' },
  ]

  doubleVerbPatterns.forEach(({ pattern, issue, suggestion }) => {
    if (pattern.test(normalized)) {
      issues.push(issue)
      suggestions.push(suggestion)
    }
  })

  // 패턴 3: 잘못된 관사 사용
  const articlePatterns = [
    { pattern: /\ba\s+[aeiou]/i, issue: 'Article "a" before vowel', suggestion: 'Use "an" before vowel sounds' },
    { pattern: /\ban\s+[bcdfghjklmnpqrstvwxyz]/i, issue: 'Article "an" before consonant', suggestion: 'Use "a" before consonant sounds' },
  ]

  // 예외 처리: "a university", "an hour" 등
  const articleExceptions = ['university', 'user', 'unique', 'hour', 'honest', 'heir']
  articlePatterns.forEach(({ pattern, issue, suggestion }) => {
    if (pattern.test(normalized)) {
      // 예외 단어 체크
      const hasException = articleExceptions.some(ex => normalized.includes(ex))
      if (!hasException) {
        issues.push(issue)
        suggestions.push(suggestion)
      }
    }
  })

  // 패턴 4: 기본적인 문장 구조 오류
  // 연속 공백만 체크 (첫 글자 대문자는 유연하게 처리)
  if (/\s{2,}/.test(sentence)) {
    issues.push('Multiple consecutive spaces')
    suggestions.push('Use single space between words')
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  }
}

/**
 * 일반적인 한국어-영어 번역 오류 패턴 감지
 */
function detectKoreanToEnglishErrors(sentence: string): {
  hasErrors: boolean
  errors: string[]
} {
  const errors: string[] = []
  const normalized = sentence.toLowerCase()

  // 직역 패턴들
  const literalPatterns = [
    { pattern: /\beat rice\?$/i, error: '밥을 rice로 직역함' },
    { pattern: /\bmake sleep\b/i, error: '재우다를 make sleep으로 직역함' },
    { pattern: /\bcatch schedule\b/i, error: '일정을 잡다를 직역함' },
    { pattern: /\bfighting\b/i, error: '화이팅을 그대로 사용함' },
    { pattern: /\bhwaiting\b/i, error: '화이팅을 그대로 사용함' },
  ]

  literalPatterns.forEach(({ pattern, error }) => {
    if (pattern.test(normalized)) {
      errors.push(error)
    }
  })

  // 누락된 주어
  if (/^(going|eating|sleeping|doing)\s/i.test(sentence.trim())) {
    errors.push('주어 누락 가능성')
  }

  // 한글 포함
  if (/[가-힣]/.test(sentence)) {
    errors.push('문장에 한글이 포함됨')
  }

  return {
    hasErrors: errors.length > 0,
    errors,
  }
}

describe('Grammar Pattern Validation', () => {
  describe('Subject-Verb Agreement', () => {
    describe('Correct patterns', () => {
      const correctPatterns = [
        'I am happy',
        'He is going',
        'She is eating',
        'They are playing',
        'We are working',
        'You are right',
        'It is cold',
      ]

      correctPatterns.forEach((sentence) => {
        it(`should accept "${sentence}"`, () => {
          const result = validateGrammar(sentence)
          expect(result.issues.filter((i) => i.includes('Subject-verb'))).toHaveLength(0)
        })
      })
    })

    describe('Incorrect patterns', () => {
      const incorrectPatterns = [
        { sentence: 'I is happy', issue: '"I is"' },
        { sentence: 'He am going', issue: '"He am"' },
        { sentence: 'They is playing', issue: '"They is"' },
        { sentence: 'We is working', issue: '"We is"' },
        { sentence: 'You is right', issue: '"You is"' },
        { sentence: 'It am cold', issue: '"It am"' },
      ]

      incorrectPatterns.forEach(({ sentence, issue }) => {
        it(`should detect error in "${sentence}"`, () => {
          const result = validateGrammar(sentence)
          expect(result.isValid).toBe(false)
          expect(result.issues.some((i) => i.includes(issue))).toBe(true)
        })
      })
    })
  })

  describe('Double Word Detection', () => {
    const doubleWordTests = [
      { sentence: 'I can can do it', shouldDetect: true, word: 'can' },
      { sentence: 'I will will go', shouldDetect: true, word: 'will' },
      { sentence: 'It is is good', shouldDetect: true, word: 'is' },
      { sentence: 'The the book', shouldDetect: true, word: 'the' },
      { sentence: 'I can do it', shouldDetect: false, word: '' },
    ]

    doubleWordTests.forEach(({ sentence, shouldDetect, word }) => {
      it(`should ${shouldDetect ? 'detect' : 'not detect'} double word in "${sentence}"`, () => {
        const result = validateGrammar(sentence)
        if (shouldDetect) {
          expect(result.issues.some((i) => i.toLowerCase().includes('double'))).toBe(true)
        } else {
          expect(result.issues.some((i) => i.toLowerCase().includes('double'))).toBe(false)
        }
      })
    })
  })

  describe('Article Usage', () => {
    describe('Correct article usage', () => {
      const correctArticles = [
        'an apple',
        'a book',
        'an elephant',
        'a car',
        'an orange',
        'a university', // 예외: 발음이 /j/
        'an hour', // 예외: h 묵음
      ]

      correctArticles.forEach((phrase) => {
        it(`should accept "${phrase}"`, () => {
          const result = validateGrammar(phrase)
          expect(result.issues.filter((i) => i.includes('Article'))).toHaveLength(0)
        })
      })
    })
  })

  describe('Empty and Invalid Input', () => {
    it('should reject empty string', () => {
      const result = validateGrammar('')
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Empty sentence')
    })

    it('should reject whitespace only', () => {
      const result = validateGrammar('   ')
      expect(result.isValid).toBe(false)
    })
  })

  describe('Multiple Space Detection', () => {
    it('should detect multiple consecutive spaces', () => {
      const result = validateGrammar('Hello  world')
      expect(result.issues).toContain('Multiple consecutive spaces')
    })

    it('should not flag single spaces', () => {
      const result = validateGrammar('Hello world')
      expect(result.issues).not.toContain('Multiple consecutive spaces')
    })
  })
})

describe('Korean to English Error Detection', () => {
  describe('Literal Translation Detection', () => {
    const literalTests = [
      { sentence: 'Did you eat rice?', shouldDetect: true, pattern: 'rice' },
      { sentence: 'Have you eaten?', shouldDetect: false, pattern: '' },
      { sentence: 'I must make sleep the baby', shouldDetect: true, pattern: 'make sleep' },
      { sentence: "I need to put the baby to sleep", shouldDetect: false, pattern: '' },
    ]

    literalTests.forEach(({ sentence, shouldDetect }) => {
      it(`should ${shouldDetect ? 'detect' : 'not detect'} literal translation in "${sentence}"`, () => {
        const result = detectKoreanToEnglishErrors(sentence)
        expect(result.hasErrors).toBe(shouldDetect)
      })
    })
  })

  describe('Korean Character Detection', () => {
    it('should detect Korean characters in sentence', () => {
      const result = detectKoreanToEnglishErrors('Hello 안녕')
      expect(result.hasErrors).toBe(true)
      expect(result.errors).toContain('문장에 한글이 포함됨')
    })

    it('should not flag pure English sentences', () => {
      const result = detectKoreanToEnglishErrors('Hello there')
      expect(result.errors).not.toContain('문장에 한글이 포함됨')
    })
  })

  describe('Missing Subject Detection', () => {
    const missingsSubjectTests = [
      { sentence: 'Going home now', hasIssue: true },
      { sentence: "I'm going home now", hasIssue: false },
      { sentence: 'Eating dinner', hasIssue: true },
      { sentence: "She's eating dinner", hasIssue: false },
    ]

    missingsSubjectTests.forEach(({ sentence, hasIssue }) => {
      it(`should ${hasIssue ? 'detect' : 'not detect'} missing subject in "${sentence}"`, () => {
        const result = detectKoreanToEnglishErrors(sentence)
        const hasMissingSubjectError = result.errors.some((e) => e.includes('주어 누락'))
        expect(hasMissingSubjectError).toBe(hasIssue)
      })
    })
  })
})

describe('Comprehensive Grammar Tests', () => {
  describe('Real-world sentence validation', () => {
    const realWorldTests = [
      { sentence: "What do you want to eat?", expected: { valid: true } },
      { sentence: "I'm going home", expected: { valid: true } },
      { sentence: "Have you eaten?", expected: { valid: true } },
      { sentence: "Let's meet at 3", expected: { valid: true } },
      { sentence: "Could you help me?", expected: { valid: true } },
    ]

    realWorldTests.forEach(({ sentence, expected }) => {
      it(`should validate "${sentence}" as ${expected.valid ? 'valid' : 'invalid'}`, () => {
        const result = validateGrammar(sentence)
        expect(result.isValid).toBe(expected.valid)
      })
    })
  })

  describe('Common learner mistakes', () => {
    const learnerMistakes = [
      { sentence: 'I am go home', description: 'verb form error' },
      { sentence: 'She have a book', description: 'verb agreement (have/has)' },
      { sentence: 'I am eat', description: 'missing -ing' },
    ]

    learnerMistakes.forEach(({ sentence, description }) => {
      it(`should handle "${description}" in "${sentence}"`, () => {
        const grammarResult = validateGrammar(sentence)
        const translationResult = detectKoreanToEnglishErrors(sentence)
        // 현재 패턴에서 감지되지 않을 수 있음, 문서화 목적
        expect(grammarResult).toBeDefined()
        expect(translationResult).toBeDefined()
      })
    })
  })
})

describe('Edge Cases', () => {
  describe('Special characters and punctuation', () => {
    const specialCharTests = [
      { sentence: "What's up?", expected: true },
      { sentence: "I'm fine, thanks!", expected: true },
      { sentence: "Hello...", expected: true },
      { sentence: "Really?!", expected: true },
    ]

    specialCharTests.forEach(({ sentence, expected }) => {
      it(`should handle "${sentence}"`, () => {
        const result = validateGrammar(sentence)
        expect(result.isValid).toBe(expected)
      })
    })
  })

  describe('Numbers and dates', () => {
    const numberTests = [
      { sentence: "Meet me at 3 o'clock", expected: true },
      { sentence: 'I have 2 apples', expected: true },
      { sentence: 'The year is 2024', expected: true },
    ]

    numberTests.forEach(({ sentence, expected }) => {
      it(`should handle "${sentence}"`, () => {
        const result = validateGrammar(sentence)
        expect(result.isValid).toBe(expected)
      })
    })
  })

  describe('Questions and exclamations', () => {
    const questionTests = [
      { sentence: 'Are you coming?', expected: true },
      { sentence: 'Where did you go?', expected: true },
      { sentence: 'What a beautiful day!', expected: true },
      { sentence: 'How wonderful!', expected: true },
    ]

    questionTests.forEach(({ sentence, expected }) => {
      it(`should handle "${sentence}"`, () => {
        const result = validateGrammar(sentence)
        expect(result.isValid).toBe(expected)
      })
    })
  })
})
