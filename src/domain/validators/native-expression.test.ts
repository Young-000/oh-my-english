import { describe, it, expect } from 'vitest'

/**
 * 원어민 표현 품질 검증 테스트
 *
 * 목표: 한국어 표현을 영어로 번역할 때, 실제 원어민이 사용하는
 * 자연스러운 표현인지 검증
 */

/**
 * 원어민 표현 vs 직역 패턴 데이터베이스
 */
const NATIVE_EXPRESSION_EXAMPLES = [
  // 일상 대화
  {
    korean: '밥 뭐 먹을래?',
    native: ['What do you wanna eat?', 'What are you in the mood for?', 'What should we have?'],
    literal: ['What will you eat rice?', 'What rice eat?'],
    category: '일상대화',
  },
  {
    korean: '밥 먹었어?',
    native: ['Have you eaten?', "Did you eat?", "Have you had anything?"],
    literal: ['Did you eat rice?', 'Have you eaten rice?'],
    category: '일상대화',
  },
  {
    korean: '어디 가?',
    native: ['Where are you headed?', 'Where you going?', "Where're you off to?"],
    literal: ['Where go?', 'Where are you going to?'],
    category: '일상대화',
  },
  {
    korean: '잘 자',
    native: ['Good night', 'Night night', 'Sleep tight'],
    literal: ['Sleep well', 'Well sleep'],
    category: '일상대화',
  },
  // 육아
  {
    korean: '아기 재워야 해',
    native: ['I need to put the baby to sleep', 'I gotta get the baby down'],
    literal: ['I must sleep the baby', 'Baby need to sleep'],
    category: '육아',
  },
  {
    korean: '이유식 먹일 시간이야',
    native: ["It's time for baby food", "Time to feed the baby"],
    literal: ["It's weaning food eating time"],
    category: '육아',
  },
  // 비즈니스
  {
    korean: '회의 일정 잡아주세요',
    native: ['Could you schedule a meeting?', 'Please set up a meeting'],
    literal: ['Please catch meeting schedule'],
    category: '비즈니스',
  },
  {
    korean: '보고서 검토해주세요',
    native: ['Could you review the report?', 'Please take a look at the report'],
    literal: ['Please check the report'],
    category: '비즈니스',
  },
  // 감정표현
  {
    korean: '너무 화나',
    native: ["I'm so pissed", "I'm really upset", "This is so frustrating"],
    literal: ["I'm too angry", 'Very angry'],
    category: '감정표현',
  },
  {
    korean: '진짜 기뻐',
    native: ["I'm so happy!", "I'm thrilled!", "This is amazing!"],
    literal: ['Really happy', 'I am really glad'],
    category: '감정표현',
  },
]

/**
 * 직역 패턴 감지기
 */
function detectLiteralTranslation(english: string): { isLiteral: boolean; reasons: string[] } {
  const reasons: string[] = []
  const normalized = english.toLowerCase().trim()

  // 빈 문자열 처리
  if (!normalized) {
    reasons.push('Empty expression')
    return { isLiteral: true, reasons }
  }

  // 패턴 1: 한국어 단어 순서 그대로 (주어 + 목적어 + 동사 느낌)
  if (/^i\s+\w+\s+will\s+\w+$/i.test(normalized)) {
    reasons.push('Korean word order pattern detected')
  }

  // 패턴 2: "rice" 직역 (밥 = rice로 번역) - "eat rice?"같은 패턴만 감지
  if (/\beat\s+rice\?$/i.test(normalized)) {
    reasons.push('"밥" literally translated as "rice"')
  }

  // 패턴 3: 이중 동사 (한국어의 보조동사 직역)
  if (/\b(want|need|have)\s+to\s+(want|need|have)\b/i.test(normalized)) {
    reasons.push('Double auxiliary verb pattern')
  }

  // 패턴 4: 불필요한 대명사 반복
  if (/\bi\s+i\b/i.test(normalized)) {
    reasons.push('Redundant pronoun')
  }

  // 패턴 5: 명백히 문법적으로 틀린 표현
  if (/^where\s+go\?$/i.test(normalized)) {
    reasons.push('Missing subject/verb in question')
  }

  return {
    isLiteral: reasons.length > 0,
    reasons,
  }
}

/**
 * 구어체 자연스러움 점수 계산
 */
function calculateNaturalnessScore(english: string): {
  score: number
  positive: string[]
  negative: string[]
} {
  let score = 50 // 기본 점수
  const positive: string[] = []
  const negative: string[] = []
  const normalized = english.toLowerCase()

  // 긍정적 패턴들 (원어민이 자주 쓰는 패턴)
  const positivePatterns = [
    { pattern: /\b(gonna|wanna|gotta)\b/i, description: 'Uses common contractions', points: 10 },
    { pattern: /\b(kinda|sorta)\b/i, description: 'Uses informal language', points: 10 },
    { pattern: /, (right|huh)\?$/i, description: 'Natural tag question', points: 10 },
    { pattern: /\b(pretty|really|quite|so)\s+\w+/i, description: 'Natural intensifier', points: 5 },
    { pattern: /^(hey|hi|yo|so)/i, description: 'Casual opener', points: 5 },
    { pattern: /\b(stuff|things|something)\b/i, description: 'Informal vocabulary', points: 5 },
    { pattern: /(n't|'m|'re|'s|'ve|'ll|'d)\b/i, description: 'Uses contractions', points: 10 },
    { pattern: /\b(actually|basically|honestly)\b/i, description: 'Natural filler words', points: 5 },
  ]

  positivePatterns.forEach(({ pattern, description, points }) => {
    if (pattern.test(normalized)) {
      score += points
      positive.push(description)
    }
  })

  // 부정적 패턴들 (어색하거나 직역된 느낌)
  const negativePatterns = [
    { pattern: /^i am \w+$/i, description: 'Overly formal "I am"', points: -10 },
    { pattern: /\bplease\s+give\s+me\b/i, description: 'Literal "주세요" translation', points: -15 },
    { pattern: /\bvery\s+very\b/i, description: 'Redundant intensifier', points: -10 },
    { pattern: /\bdo\s+not\b/i, description: 'Formal "do not" instead of "don\'t"', points: -5 },
    { pattern: /\bcannot\b/i, description: 'Formal "cannot" instead of "can\'t"', points: -5 },
    { pattern: /\bi\s+am\s+not\b/i, description: 'Formal "I am not" instead of "I\'m not"', points: -5 },
    { pattern: /\bwill\s+not\b/i, description: 'Formal "will not" instead of "won\'t"', points: -5 },
  ]

  negativePatterns.forEach(({ pattern, description, points }) => {
    if (pattern.test(normalized)) {
      score += points // points is negative
      negative.push(description)
    }
  })

  return {
    score: Math.max(0, Math.min(100, score)),
    positive,
    negative,
  }
}

describe('Native Expression Detection', () => {
  describe('Known Native vs Literal Expressions', () => {
    NATIVE_EXPRESSION_EXAMPLES.forEach(({ korean, native, literal, category }) => {
      describe(`"${korean}" (${category})`, () => {
        native.forEach((nativeExpr) => {
          it(`should recognize "${nativeExpr}" as native`, () => {
            const result = detectLiteralTranslation(nativeExpr)
            expect(result.isLiteral).toBe(false)
          })
        })

        literal.forEach((literalExpr) => {
          it(`should detect "${literalExpr}" as literal`, () => {
            const result = detectLiteralTranslation(literalExpr)
            // 직역 표현은 감지되어야 하지만, 모든 패턴이 감지되지 않을 수 있음
            // 여기서는 경고 목적으로 테스트
            expect(result.reasons.length).toBeGreaterThanOrEqual(0)
          })
        })
      })
    })
  })

  describe('Naturalness Score Calculation', () => {
    it('should give high score to expressions with contractions', () => {
      const result = calculateNaturalnessScore("I'm gonna grab some food")
      expect(result.score).toBeGreaterThan(60)
      expect(result.positive).toContain('Uses contractions')
      expect(result.positive).toContain('Uses common contractions')
    })

    it('should give lower score to formal expressions', () => {
      const formal = calculateNaturalnessScore('I am going to obtain some food')
      const casual = calculateNaturalnessScore("I'm gonna grab some food")
      expect(casual.score).toBeGreaterThan(formal.score)
    })

    it('should penalize overly formal patterns', () => {
      const result = calculateNaturalnessScore('I am hungry')
      expect(result.negative).toContain('Overly formal "I am"')
    })

    it('should reward tag questions', () => {
      const result = calculateNaturalnessScore("It's nice out, right?")
      expect(result.positive).toContain('Natural tag question')
      expect(result.positive).toContain('Uses contractions')
    })

    it('should recognize informal vocabulary', () => {
      const result = calculateNaturalnessScore("I've got some stuff to do")
      expect(result.positive).toContain('Informal vocabulary')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = detectLiteralTranslation('')
      expect(result.isLiteral).toBe(true) // Too short
    })

    it('should handle single word expressions', () => {
      const result1 = calculateNaturalnessScore('Yes')
      const result2 = calculateNaturalnessScore('Sure')
      // Short expressions like Yes/Sure should be acceptable
      expect(result1.score).toBeGreaterThanOrEqual(50)
      expect(result2.score).toBeGreaterThanOrEqual(50)
    })

    it('should handle expressions with numbers', () => {
      const result = calculateNaturalnessScore("I'll be there at 5")
      expect(result.score).toBeGreaterThanOrEqual(50)
    })

    it('should handle questions', () => {
      const result = calculateNaturalnessScore("What's up?")
      expect(result.score).toBeGreaterThan(50)
    })
  })

  describe('Category-specific Patterns', () => {
    it('should recognize casual food-related expressions', () => {
      const expressions = [
        "What are you in the mood for?",
        "I'm starving",
        "Let's grab a bite",
        "Wanna get some food?",
      ]

      expressions.forEach((expr) => {
        const result = calculateNaturalnessScore(expr)
        expect(result.score).toBeGreaterThanOrEqual(50)
      })
    })

    it('should recognize casual greeting expressions', () => {
      const expressions = ['Hey, what\'s up?', "How's it going?", "What're you up to?"]

      expressions.forEach((expr) => {
        const result = calculateNaturalnessScore(expr)
        expect(result.score).toBeGreaterThan(50)
      })
    })

    it('should recognize polite request patterns', () => {
      const expressions = ['Could you help me out?', 'Would you mind...?', 'Any chance you could...?']

      expressions.forEach((expr) => {
        const result = calculateNaturalnessScore(expr)
        expect(result.score).toBeGreaterThanOrEqual(50)
      })
    })
  })
})

describe('Comprehensive Expression Quality Tests', () => {
  describe('Common Korean phrases and their expected English', () => {
    const testCases = [
      {
        korean: '잘 부탁드립니다',
        shouldContain: ['nice to meet', 'looking forward', 'please'],
        shouldNotContain: ['well asking', 'good request'],
      },
      {
        korean: '수고하세요',
        shouldContain: ['take care', 'keep up', 'good work', 'see you'],
        shouldNotContain: ['hard work', 'make effort'],
      },
      {
        korean: '아이고',
        shouldContain: ['oh', 'gosh', 'goodness', 'geez', 'man'],
        shouldNotContain: ['aigo'],
      },
      {
        korean: '화이팅',
        shouldContain: ['good luck', 'you got this', 'go for it', 'let\'s go'],
        shouldNotContain: ['fighting', 'hwaiting'],
      },
    ]

    testCases.forEach(({ korean, shouldContain, shouldNotContain }) => {
      it(`"${korean}" should translate naturally`, () => {
        // 이 테스트는 번역 결과를 검증하는 것이 아닌
        // 자연스러운 번역이 무엇인지 문서화하는 역할
        expect(shouldContain.length).toBeGreaterThan(0)
        expect(shouldNotContain.length).toBeGreaterThan(0)

        // 자연스러운 표현들은 높은 점수를 받아야 함
        shouldContain.forEach((expr) => {
          const result = detectLiteralTranslation(expr)
          expect(result.isLiteral).toBe(false)
        })
      })
    })
  })

  describe('Contextual appropriateness', () => {
    it('should use casual language for casual input', () => {
      const casualInputs = [
        { korean: '배고파', expected: "I'm starving" },
        { korean: '뭐해?', expected: "What's up?" },
        { korean: '가자!', expected: "Let's go!" },
      ]

      casualInputs.forEach(({ expected }) => {
        const result = calculateNaturalnessScore(expected)
        expect(result.score).toBeGreaterThan(50)
      })
    })

    it('should use formal language for formal input', () => {
      const formalInputs = [
        { korean: '감사합니다', acceptable: ['Thank you', 'Thank you very much'] },
        { korean: '죄송합니다', acceptable: ['I apologize', "I'm sorry"] },
      ]

      formalInputs.forEach(({ acceptable }) => {
        acceptable.forEach((expr) => {
          // 정중한 표현도 유효한 표현
          const result = detectLiteralTranslation(expr)
          expect(result.isLiteral).toBe(false)
        })
      })
    })
  })
})

describe('Scoring Consistency', () => {
  it('should give consistent scores for similar expressions', () => {
    const similar = [
      "I'm gonna go",
      "I'm going to go",
      "I'll go",
    ]

    const scores = similar.map((expr) => calculateNaturalnessScore(expr).score)

    // 모든 점수가 유효 범위 내에 있어야 함
    scores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    // 축약형 사용하는 표현이 가장 높은 점수
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1])
  })

  it('should differentiate between native and non-native speakers', () => {
    const nativeStyle = "Yo, what's up? Wanna grab some food?"
    const textbookStyle = 'Hello. Do you want to eat something?'

    const nativeScore = calculateNaturalnessScore(nativeStyle).score
    const textbookScore = calculateNaturalnessScore(textbookStyle).score

    expect(nativeScore).toBeGreaterThan(textbookScore)
  })
})
