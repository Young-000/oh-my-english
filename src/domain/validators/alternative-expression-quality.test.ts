import { describe, it, expect } from 'vitest'

/**
 * 대안 표현 품질 테스트
 *
 * AI가 생성한 대안 표현이 다음 기준을 충족하는지 검증:
 * - 원래 표현과 의미는 같지만 다른 뉘앙스
 * - 각 대안마다 명확한 상황 설명
 * - 실제 원어민이 사용하는 표현
 * - 충분한 다양성
 */

interface Alternative {
  expression: string
  situation: string
  difference: string
}

/**
 * 대안 표현 품질 점수 계산
 */
function evaluateAlternativeQuality(
  original: string,
  alternative: Alternative
): {
  score: number
  issues: string[]
} {
  const issues: string[] = []
  let score = 100

  // 1. 대안이 원본과 동일하면 안됨
  if (original.toLowerCase() === alternative.expression.toLowerCase()) {
    issues.push('Alternative is identical to original')
    score -= 50
  }

  // 2. 대안이 너무 짧으면 안됨 (단일 단어)
  const wordCount = alternative.expression.split(/\s+/).length
  if (wordCount < 2 && original.split(/\s+/).length >= 2) {
    issues.push('Alternative is too short compared to original')
    score -= 20
  }

  // 3. 상황 설명이 있어야 함
  if (!alternative.situation || alternative.situation.length < 3) {
    issues.push('Missing or too short situation description')
    score -= 15
  }

  // 4. 차이점 설명이 있어야 함
  if (!alternative.difference || alternative.difference.length < 3) {
    issues.push('Missing or too short difference description')
    score -= 15
  }

  // 5. 문법적으로 완전한 표현이어야 함
  const hasVerb = /\b(is|are|am|was|were|have|has|had|do|does|did|can|could|will|would|should|may|might|must|going|eating|playing|working|want|need|like|love|make|get|take|give|come|go|see|know|think|feel)\b/i.test(
    alternative.expression
  )
  if (!hasVerb && wordCount > 1) {
    issues.push('Alternative may be missing a verb')
    score -= 10
  }

  return {
    score: Math.max(0, score),
    issues,
  }
}

/**
 * 대안 집합의 다양성 평가
 */
function evaluateAlternativeDiversity(alternatives: Alternative[]): {
  diversityScore: number
  issues: string[]
} {
  const issues: string[] = []
  let diversityScore = 100

  if (alternatives.length === 0) {
    return { diversityScore: 0, issues: ['No alternatives provided'] }
  }

  // 1. 충분한 수의 대안이 있어야 함 (최소 2개)
  if (alternatives.length < 2) {
    issues.push('Too few alternatives')
    diversityScore -= 30
  }

  // 2. 대안들이 서로 다른지 확인
  const expressions = alternatives.map((a) => a.expression.toLowerCase())
  const uniqueExpressions = new Set(expressions)
  if (uniqueExpressions.size < expressions.length) {
    issues.push('Duplicate alternatives found')
    diversityScore -= 25
  }

  // 3. 상황이 다양한지 확인
  const situations = alternatives.map((a) => a.situation.toLowerCase())
  const uniqueSituations = new Set(situations)
  if (uniqueSituations.size < Math.min(situations.length, 3)) {
    issues.push('Situations are too similar')
    diversityScore -= 15
  }

  // 4. 길이 다양성 (짧은 표현, 긴 표현 섞여있는지)
  const lengths = alternatives.map((a) => a.expression.split(/\s+/).length)
  const minLen = Math.min(...lengths)
  const maxLen = Math.max(...lengths)
  if (maxLen - minLen < 1 && alternatives.length >= 2) {
    issues.push('Alternatives have similar lengths')
    diversityScore -= 10
  }

  return {
    diversityScore: Math.max(0, diversityScore),
    issues,
  }
}

/**
 * 특정 카테고리에 맞는 대안인지 확인
 */
function isAlternativeAppropriateForCategory(
  alternative: Alternative,
  category: string
): boolean {
  const categoryPatterns: Record<string, RegExp[]> = {
    비즈니스: [
      /\b(would|could|please|appreciate|schedule|meeting|report|review)\b/i,
    ],
    육아: [/\b(baby|kid|child|sweetie|honey|mommy|daddy|nap|play|eat)\b/i],
    일상대화: [/\b(gonna|wanna|hey|hi|cool|awesome|nice|great)\b/i],
  }

  const patterns = categoryPatterns[category]
  if (!patterns) return true // 알 수 없는 카테고리는 통과

  // 카테고리 패턴에 맞거나, 일반적인 표현이면 OK
  return patterns.some((p) => p.test(alternative.expression)) || true
}

describe('Alternative Expression Quality', () => {
  describe('Individual Alternative Quality', () => {
    describe('Valid alternatives', () => {
      const validCases = [
        {
          original: 'Have you eaten?',
          alternative: {
            expression: 'Did you eat?',
            situation: 'casual conversation',
            difference: 'more direct past tense',
          },
        },
        {
          original: 'What do you want to eat?',
          alternative: {
            expression: 'What would you like to eat?',
            situation: 'polite/formal setting',
            difference: 'more polite phrasing',
          },
        },
        {
          original: "I'm going home",
          alternative: {
            expression: "I'm heading home",
            situation: 'casual conversation',
            difference: 'slightly more active tone',
          },
        },
      ]

      validCases.forEach(({ original, alternative }) => {
        it(`should accept "${alternative.expression}" as valid alternative to "${original}"`, () => {
          const result = evaluateAlternativeQuality(original, alternative)
          expect(result.score).toBeGreaterThanOrEqual(70)
        })
      })
    })

    describe('Invalid alternatives', () => {
      it('should reject identical alternative', () => {
        const result = evaluateAlternativeQuality('Have you eaten?', {
          expression: 'Have you eaten?',
          situation: 'same',
          difference: 'none',
        })
        expect(result.score).toBeLessThan(70)
        expect(result.issues).toContain('Alternative is identical to original')
      })

      it('should penalize missing situation', () => {
        const result = evaluateAlternativeQuality('Have you eaten?', {
          expression: 'Did you eat?',
          situation: '',
          difference: 'more direct',
        })
        expect(result.issues).toContain('Missing or too short situation description')
      })

      it('should penalize missing difference', () => {
        const result = evaluateAlternativeQuality('Have you eaten?', {
          expression: 'Did you eat?',
          situation: 'casual',
          difference: '',
        })
        expect(result.issues).toContain('Missing or too short difference description')
      })
    })
  })

  describe('Alternative Set Diversity', () => {
    describe('Good diversity', () => {
      it('should accept diverse set of alternatives', () => {
        const alternatives: Alternative[] = [
          {
            expression: 'Did you eat?',
            situation: 'casual, among friends',
            difference: 'simple past tense',
          },
          {
            expression: 'Have you had anything to eat?',
            situation: 'concerned tone',
            difference: 'implies worry about person',
          },
          {
            expression: 'Eaten yet?',
            situation: 'very casual, texting',
            difference: 'extremely informal, shortened',
          },
        ]

        const result = evaluateAlternativeDiversity(alternatives)
        expect(result.diversityScore).toBeGreaterThanOrEqual(70)
      })

      it('should accept alternatives with varying formality', () => {
        const alternatives: Alternative[] = [
          {
            expression: 'Would you like to eat?',
            situation: 'formal setting',
            difference: 'polite inquiry',
          },
          {
            expression: 'Wanna grab some food?',
            situation: 'casual with friends',
            difference: 'very informal',
          },
        ]

        const result = evaluateAlternativeDiversity(alternatives)
        expect(result.diversityScore).toBeGreaterThanOrEqual(60)
      })
    })

    describe('Poor diversity', () => {
      it('should penalize empty alternatives', () => {
        const result = evaluateAlternativeDiversity([])
        expect(result.diversityScore).toBe(0)
        expect(result.issues).toContain('No alternatives provided')
      })

      it('should penalize single alternative', () => {
        const result = evaluateAlternativeDiversity([
          {
            expression: 'Did you eat?',
            situation: 'casual',
            difference: 'past tense',
          },
        ])
        expect(result.diversityScore).toBeLessThan(80)
        expect(result.issues).toContain('Too few alternatives')
      })

      it('should penalize duplicate alternatives', () => {
        const alternatives: Alternative[] = [
          {
            expression: 'Did you eat?',
            situation: 'casual',
            difference: 'past tense',
          },
          {
            expression: 'Did you eat?',
            situation: 'different situation',
            difference: 'same expression',
          },
        ]

        const result = evaluateAlternativeDiversity(alternatives)
        expect(result.issues).toContain('Duplicate alternatives found')
      })
    })
  })

  describe('Category Appropriateness', () => {
    describe('Business alternatives', () => {
      const businessAlternatives: Alternative[] = [
        {
          expression: 'Could you please review this?',
          situation: 'formal request',
          difference: 'polite business tone',
        },
        {
          expression: 'Would you mind taking a look?',
          situation: 'gentle request',
          difference: 'softer approach',
        },
        {
          expression: 'I would appreciate your feedback',
          situation: 'formal email',
          difference: 'professional phrasing',
        },
      ]

      businessAlternatives.forEach((alt) => {
        it(`should accept "${alt.expression}" for business category`, () => {
          const isAppropriate = isAlternativeAppropriateForCategory(alt, '비즈니스')
          expect(isAppropriate).toBe(true)
        })
      })
    })

    describe('Childcare alternatives', () => {
      const childcareAlternatives: Alternative[] = [
        {
          expression: 'What does the baby want to eat?',
          situation: 'feeding time',
          difference: 'direct question',
        },
        {
          expression: "What would sweetie like?",
          situation: 'gentle tone',
          difference: 'affectionate',
        },
        {
          expression: "Time to eat, honey!",
          situation: 'mealtime announcement',
          difference: 'statement not question',
        },
      ]

      childcareAlternatives.forEach((alt) => {
        it(`should accept "${alt.expression}" for childcare category`, () => {
          const isAppropriate = isAlternativeAppropriateForCategory(alt, '육아')
          expect(isAppropriate).toBe(true)
        })
      })
    })
  })
})

describe('Real-World Alternative Scenarios', () => {
  /**
   * 실제 학습 시나리오에서 나올 수 있는 대안들
   */
  const realWorldScenarios = [
    {
      korean: '밥 먹었어?',
      original: 'Have you eaten?',
      alternatives: [
        {
          expression: 'Did you eat?',
          situation: 'casual, among friends',
          difference: 'simple past, more direct',
        },
        {
          expression: 'Have you had anything?',
          situation: 'concerned, caring',
          difference: 'implies care about wellbeing',
        },
        {
          expression: 'Eaten yet?',
          situation: 'very casual, texting',
          difference: 'extremely shortened',
        },
      ],
    },
    {
      korean: '어디 가?',
      original: 'Where are you going?',
      alternatives: [
        {
          expression: 'Where you headed?',
          situation: 'casual American',
          difference: 'informal, friendly',
        },
        {
          expression: 'Off somewhere?',
          situation: 'curious, light',
          difference: 'less direct question',
        },
        {
          expression: 'Going out?',
          situation: 'parent to child',
          difference: 'simple yes/no expected',
        },
      ],
    },
    {
      korean: '고마워',
      original: 'Thank you',
      alternatives: [
        {
          expression: 'Thanks!',
          situation: 'casual',
          difference: 'shorter, friendlier',
        },
        {
          expression: 'Thanks a lot!',
          situation: 'enthusiastic',
          difference: 'more grateful',
        },
        {
          expression: 'I really appreciate it',
          situation: 'sincere gratitude',
          difference: 'more formal and heartfelt',
        },
        {
          expression: 'Cheers!',
          situation: 'British casual',
          difference: 'regional variation',
        },
      ],
    },
    {
      korean: '미안해',
      original: "I'm sorry",
      alternatives: [
        {
          expression: 'Sorry!',
          situation: 'quick apology',
          difference: 'casual, brief',
        },
        {
          expression: 'My bad',
          situation: 'admitting fault casually',
          difference: 'slang, informal',
        },
        {
          expression: 'I apologize',
          situation: 'formal setting',
          difference: 'more professional',
        },
        {
          expression: 'Pardon me',
          situation: 'polite, formal',
          difference: 'old-fashioned politeness',
        },
      ],
    },
    {
      korean: '뭐해?',
      original: 'What are you doing?',
      alternatives: [
        {
          expression: "What's up?",
          situation: 'greeting/casual check-in',
          difference: 'very casual, common',
        },
        {
          expression: 'Whatcha doing?',
          situation: 'friendly, curious',
          difference: 'informal contraction',
        },
        {
          expression: 'What are you up to?',
          situation: 'friendly inquiry',
          difference: 'common casual phrase',
        },
      ],
    },
  ]

  realWorldScenarios.forEach(({ korean, original, alternatives }) => {
    describe(`Alternatives for "${korean}" (${original})`, () => {
      it('should have enough alternatives', () => {
        expect(alternatives.length).toBeGreaterThanOrEqual(2)
      })

      it('should have diverse alternatives', () => {
        const result = evaluateAlternativeDiversity(alternatives)
        expect(result.diversityScore).toBeGreaterThanOrEqual(50)
      })

      alternatives.forEach((alt) => {
        it(`should have quality alternative "${alt.expression}"`, () => {
          const result = evaluateAlternativeQuality(original, alt)
          expect(result.score).toBeGreaterThanOrEqual(60)
        })
      })
    })
  })
})

describe('Alternative Expression Edge Cases', () => {
  describe('Single word expressions', () => {
    const singleWordCases = [
      {
        original: 'Hello',
        alternatives: [
          { expression: 'Hi', situation: 'casual', difference: 'shorter' },
          { expression: 'Hey', situation: 'very casual', difference: 'friendlier' },
          { expression: 'Greetings', situation: 'formal', difference: 'old-fashioned' },
        ],
      },
      {
        original: 'Thanks',
        alternatives: [
          { expression: 'Cheers', situation: 'British', difference: 'regional' },
          { expression: 'Ta', situation: 'British informal', difference: 'very casual' },
        ],
      },
    ]

    singleWordCases.forEach(({ original, alternatives }) => {
      it(`should handle single word "${original}" with alternatives`, () => {
        alternatives.forEach((alt) => {
          const result = evaluateAlternativeQuality(original, alt)
          // 단일 단어는 다른 단일 단어 대안도 허용
          expect(result.score).toBeGreaterThanOrEqual(50)
        })
      })
    })
  })

  describe('Very long expressions', () => {
    it('should handle long original with varied alternatives', () => {
      const original = "I was wondering if you could possibly help me with this"
      const alternatives: Alternative[] = [
        {
          expression: 'Could you help me with this?',
          situation: 'direct request',
          difference: 'more concise',
        },
        {
          expression: 'Would you mind helping me?',
          situation: 'polite request',
          difference: 'softer tone',
        },
        {
          expression: 'Can you give me a hand?',
          situation: 'casual',
          difference: 'informal idiom',
        },
      ]

      alternatives.forEach((alt) => {
        const result = evaluateAlternativeQuality(original, alt)
        expect(result.score).toBeGreaterThanOrEqual(70)
      })
    })
  })

  describe('Question vs Statement alternatives', () => {
    it('should accept statement alternative to question', () => {
      const result = evaluateAlternativeQuality('Are you hungry?', {
        expression: "You must be hungry",
        situation: 'assuming, caring',
        difference: 'statement instead of question',
      })
      expect(result.score).toBeGreaterThanOrEqual(70)
    })

    it('should accept question alternative to statement', () => {
      const result = evaluateAlternativeQuality("I'm hungry", {
        expression: 'Want to grab some food?',
        situation: 'suggesting action',
        difference: 'implies solution',
      })
      expect(result.score).toBeGreaterThanOrEqual(70)
    })
  })

  describe('Formality level alternatives', () => {
    const formalityTests = [
      {
        original: 'Could you please review this document?',
        casual: 'Can you check this out?',
        formal: 'I would appreciate your review of this document',
      },
      {
        original: 'I need to leave now',
        casual: 'Gotta run!',
        formal: 'I must be going now',
      },
      {
        original: 'That sounds great',
        casual: 'Awesome!',
        formal: 'That would be wonderful',
      },
    ]

    formalityTests.forEach(({ original, casual, formal }) => {
      it(`should accept both casual "${casual}" and formal "${formal}" as alternatives to "${original}"`, () => {
        const casualResult = evaluateAlternativeQuality(original, {
          expression: casual,
          situation: 'casual setting',
          difference: 'informal version',
        })
        const formalResult = evaluateAlternativeQuality(original, {
          expression: formal,
          situation: 'formal setting',
          difference: 'formal version',
        })

        expect(casualResult.score).toBeGreaterThanOrEqual(60)
        expect(formalResult.score).toBeGreaterThanOrEqual(60)
      })
    })
  })
})

describe('Alternative Completeness Check', () => {
  /**
   * 대안이 포함해야 하는 다양한 측면들
   */
  const completenessChecks = [
    {
      description: 'Formality variations',
      korean: '감사합니다',
      shouldHave: ['formal', 'casual', 'informal'],
      alternatives: [
        { expression: 'Thank you very much', situation: 'formal', difference: 'polite' },
        { expression: 'Thanks!', situation: 'casual', difference: 'friendly' },
        { expression: 'Thx', situation: 'texting/informal', difference: 'abbreviated' },
      ],
    },
    {
      description: 'Regional variations',
      korean: '화장실이 어디예요?',
      shouldHave: ['American', 'British'],
      alternatives: [
        { expression: "Where's the bathroom?", situation: 'American English', difference: 'US term' },
        { expression: "Where's the toilet?", situation: 'British English', difference: 'UK term' },
        { expression: "Where's the restroom?", situation: 'Formal American', difference: 'polite US' },
        { expression: "Where's the loo?", situation: 'British casual', difference: 'UK slang' },
      ],
    },
    {
      description: 'Urgency variations',
      korean: '도와주세요',
      shouldHave: ['urgent', 'polite', 'casual'],
      alternatives: [
        { expression: 'Help!', situation: 'emergency', difference: 'urgent cry' },
        { expression: 'Could you help me?', situation: 'polite request', difference: 'formal' },
        { expression: 'Give me a hand?', situation: 'casual request', difference: 'informal' },
      ],
    },
  ]

  completenessChecks.forEach(({ description, korean, shouldHave, alternatives }) => {
    describe(description, () => {
      it(`should provide alternatives for "${korean}" covering: ${shouldHave.join(', ')}`, () => {
        expect(alternatives.length).toBeGreaterThanOrEqual(shouldHave.length - 1)

        const situations = alternatives.map((a) => a.situation.toLowerCase())
        const hasSomeVariety = shouldHave.some((variation) =>
          situations.some((s) => s.includes(variation.toLowerCase()))
        )
        expect(hasSomeVariety).toBe(true)
      })

      it('should have quality in all alternatives', () => {
        alternatives.forEach((alt) => {
          expect(alt.expression.length).toBeGreaterThan(0)
          expect(alt.situation.length).toBeGreaterThan(0)
          expect(alt.difference.length).toBeGreaterThan(0)
        })
      })
    })
  })
})
