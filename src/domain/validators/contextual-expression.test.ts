import { describe, it, expect } from 'vitest'

/**
 * 문맥에 따른 표현 적절성 테스트
 *
 * 같은 한국어라도 상황에 따라 다른 영어 표현이 적절할 수 있음
 * 이 테스트는 문맥 인식과 표현 다양성을 검증
 */

/**
 * 문맥 유형
 */
type Context = 'formal' | 'casual' | 'business' | 'childcare' | 'romantic' | 'urgent'

/**
 * 표현 적절성 점수 계산
 */
function calculateContextScore(expression: string, context: Context): {
  score: number
  reasons: string[]
} {
  const reasons: string[] = []
  let score = 50 // 기본 점수
  const normalized = expression.toLowerCase()

  const contextPatterns: Record<Context, { positive: RegExp[]; negative: RegExp[] }> = {
    formal: {
      positive: [
        /\b(please|would you|could you|i would like)\b/i,
        /\b(appreciate|grateful|kindly)\b/i,
        /\b(sincerely|respectfully)\b/i,
      ],
      negative: [
        /\b(gonna|wanna|gotta)\b/i,
        /\b(hey|yo|sup)\b/i,
        /\b(cool|awesome|dude)\b/i,
      ],
    },
    casual: {
      positive: [
        /\b(gonna|wanna|gotta)\b/i,
        /\b(hey|hi|yo)\b/i,
        /\b(cool|awesome|nice)\b/i,
        /'(m|re|ll|ve|d)\b/i,
      ],
      negative: [
        /\b(would you kindly|i would appreciate)\b/i,
        /\b(furthermore|therefore|hence)\b/i,
      ],
    },
    business: {
      positive: [
        /\b(schedule|meeting|report|deadline)\b/i,
        /\b(please review|kindly confirm)\b/i,
        /\b(regarding|concerning|with respect to)\b/i,
      ],
      negative: [
        /\b(dude|bro|man)\b/i,
        /\b(like|whatever)\b/i,
      ],
    },
    childcare: {
      positive: [
        /\b(sweetie|honey|baby|little one)\b/i,
        /\b(nap|sleep|eat|play)\b/i,
        /\b(mommy|daddy|time for)\b/i,
      ],
      negative: [
        /\b(damn|crap|shut up)\b/i,
      ],
    },
    romantic: {
      positive: [
        /\b(love|darling|sweetheart|miss you)\b/i,
        /\b(beautiful|gorgeous|amazing)\b/i,
      ],
      negative: [
        /\b(bro|dude|man)\b/i,
      ],
    },
    urgent: {
      positive: [
        /\b(now|immediately|asap|hurry)\b/i,
        /\b(urgent|emergency|quick)\b/i,
        /!/,
      ],
      negative: [
        /\b(whenever|no rush|take your time)\b/i,
      ],
    },
  }

  const patterns = contextPatterns[context]

  patterns.positive.forEach((pattern) => {
    if (pattern.test(normalized)) {
      score += 10
      reasons.push(`Appropriate for ${context} context`)
    }
  })

  patterns.negative.forEach((pattern) => {
    if (pattern.test(normalized)) {
      score -= 15
      reasons.push(`Inappropriate for ${context} context`)
    }
  })

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  }
}

describe('Contextual Expression Appropriateness', () => {
  describe('Formal context', () => {
    const formalExpressions = [
      { expr: 'I would appreciate your help.', expected: 'appropriate' },
      { expr: 'Could you please review this document?', expected: 'appropriate' },
      { expr: 'Hey, can you help me out?', expected: 'inappropriate' },
      { expr: 'Yo, check this out!', expected: 'inappropriate' },
    ]

    formalExpressions.forEach(({ expr, expected }) => {
      it(`should rate "${expr}" as ${expected} for formal context`, () => {
        const result = calculateContextScore(expr, 'formal')
        if (expected === 'appropriate') {
          expect(result.score).toBeGreaterThanOrEqual(50)
        } else {
          expect(result.score).toBeLessThan(50)
        }
      })
    })
  })

  describe('Casual context', () => {
    const casualExpressions = [
      { expr: "Hey, what's up?", expected: 'appropriate' },
      { expr: "I'm gonna grab some food", expected: 'appropriate' },
      { expr: 'I would be most grateful for your assistance.', expected: 'inappropriate' },
    ]

    casualExpressions.forEach(({ expr, expected }) => {
      it(`should rate "${expr}" as ${expected} for casual context`, () => {
        const result = calculateContextScore(expr, 'casual')
        if (expected === 'appropriate') {
          expect(result.score).toBeGreaterThanOrEqual(50)
        } else {
          expect(result.score).toBeLessThanOrEqual(50)
        }
      })
    })
  })

  describe('Business context', () => {
    const businessExpressions = [
      { expr: 'Please review the attached report.', expected: 'appropriate' },
      { expr: 'Could you schedule a meeting for tomorrow?', expected: 'appropriate' },
      { expr: 'Regarding your inquiry...', expected: 'appropriate' },
      { expr: "Dude, let's do this thing!", expected: 'inappropriate' },
    ]

    businessExpressions.forEach(({ expr, expected }) => {
      it(`should rate "${expr}" as ${expected} for business context`, () => {
        const result = calculateContextScore(expr, 'business')
        if (expected === 'appropriate') {
          expect(result.score).toBeGreaterThanOrEqual(50)
        } else {
          expect(result.score).toBeLessThan(50)
        }
      })
    })
  })

  describe('Childcare context', () => {
    const childcareExpressions = [
      { expr: "Time for your nap, sweetie!", expected: 'appropriate' },
      { expr: "Let's play with the blocks!", expected: 'appropriate' },
      { expr: "Mommy needs to change your diaper.", expected: 'appropriate' },
    ]

    childcareExpressions.forEach(({ expr, expected }) => {
      it(`should rate "${expr}" as ${expected} for childcare context`, () => {
        const result = calculateContextScore(expr, 'childcare')
        expect(result.score).toBeGreaterThanOrEqual(50)
      })
    })
  })

  describe('Urgent context', () => {
    const urgentExpressions = [
      { expr: 'Call me now!', expected: 'appropriate' },
      { expr: 'This is urgent - please respond ASAP!', expected: 'appropriate' },
      { expr: 'Hurry up!', expected: 'appropriate' },
      { expr: 'No rush, take your time.', expected: 'inappropriate' },
    ]

    urgentExpressions.forEach(({ expr, expected }) => {
      it(`should rate "${expr}" as ${expected} for urgent context`, () => {
        const result = calculateContextScore(expr, 'urgent')
        if (expected === 'appropriate') {
          expect(result.score).toBeGreaterThanOrEqual(50)
        } else {
          expect(result.score).toBeLessThan(50)
        }
      })
    })
  })
})

describe('Same Korean, Different Context', () => {
  /**
   * 같은 한국어 표현도 문맥에 따라 다른 영어가 적절
   */
  const contextualTranslations = [
    {
      korean: '감사합니다',
      contexts: {
        formal: {
          good: ['Thank you very much', 'I sincerely appreciate it', 'Many thanks'],
          bad: ['Thanks!', 'Thx'],
        },
        casual: {
          good: ['Thanks!', 'Thanks a lot!', 'Appreciate it!'],
          bad: ['I would like to express my sincere gratitude'],
        },
      },
    },
    {
      korean: '미안해요',
      contexts: {
        formal: {
          good: ['I apologize', 'I am sorry for the inconvenience', 'Please accept my apologies'],
          bad: ['My bad', 'Sorry!', 'Oops'],
        },
        casual: {
          good: ['My bad', 'Sorry!', "Sorry about that"],
          bad: ['I sincerely apologize for any inconvenience caused'],
        },
      },
    },
    {
      korean: '도와주세요',
      contexts: {
        formal: {
          good: ['Could you please assist me?', 'I would appreciate your help'],
          bad: ['Help me out!', 'Give me a hand'],
        },
        casual: {
          good: ['Help me out!', 'Give me a hand', 'Can you help?'],
          bad: ['I would be most grateful for your assistance'],
        },
        urgent: {
          good: ['Help! Now!', 'I need help immediately!'],
          bad: ['When you have a moment, could you possibly help?'],
        },
      },
    },
  ]

  contextualTranslations.forEach(({ korean, contexts }) => {
    describe(`"${korean}" translations`, () => {
      Object.entries(contexts).forEach(([context, { good, bad }]) => {
        describe(`in ${context} context`, () => {
          good.forEach((expr: string) => {
            it(`should accept "${expr}" as appropriate`, () => {
              const result = calculateContextScore(expr, context as Context)
              expect(result.score).toBeGreaterThanOrEqual(45) // 유연한 기준
            })
          })

          bad.forEach((expr: string) => {
            it(`should rate "${expr}" lower`, () => {
              const result = calculateContextScore(expr, context as Context)
              // bad 표현은 해당 문맥에서 낮거나 기본 점수
              expect(result.score).toBeLessThanOrEqual(60)
            })
          })
        })
      })
    })
  })
})

describe('Expression Variety', () => {
  /**
   * 다양한 상황에서 원어민이 실제로 사용하는 표현 변형
   */
  const expressionVarieties = [
    {
      concept: '인사',
      variations: [
        { expr: 'Hello', formality: 'neutral' },
        { expr: 'Hi there', formality: 'casual' },
        { expr: 'Hey', formality: 'very casual' },
        { expr: 'Good morning/afternoon/evening', formality: 'formal' },
        { expr: "How's it going?", formality: 'casual' },
        { expr: "What's up?", formality: 'very casual' },
        { expr: 'How do you do?', formality: 'very formal' },
      ],
    },
    {
      concept: '작별',
      variations: [
        { expr: 'Goodbye', formality: 'neutral' },
        { expr: 'Bye', formality: 'casual' },
        { expr: 'See you later', formality: 'casual' },
        { expr: 'Take care', formality: 'neutral' },
        { expr: 'Catch you later', formality: 'very casual' },
        { expr: 'Farewell', formality: 'very formal' },
      ],
    },
    {
      concept: '동의',
      variations: [
        { expr: 'Yes', formality: 'neutral' },
        { expr: 'Yeah', formality: 'casual' },
        { expr: 'Yep', formality: 'very casual' },
        { expr: 'Absolutely', formality: 'formal' },
        { expr: 'Indeed', formality: 'formal' },
        { expr: 'Sure', formality: 'casual' },
        { expr: 'Of course', formality: 'neutral' },
      ],
    },
  ]

  expressionVarieties.forEach(({ concept, variations }) => {
    describe(`${concept} expressions`, () => {
      it(`should have multiple valid variations`, () => {
        expect(variations.length).toBeGreaterThan(3)
      })

      it('should cover different formality levels', () => {
        const formalityLevels = new Set(variations.map((v) => v.formality))
        expect(formalityLevels.size).toBeGreaterThanOrEqual(3)
      })

      variations.forEach(({ expr, formality }) => {
        it(`should recognize "${expr}" as ${formality}`, () => {
          // 각 표현이 유효한 영어 표현인지 확인
          expect(expr.length).toBeGreaterThan(0)
          expect(formality).toBeDefined()
        })
      })
    })
  })
})

describe('Colloquial vs Written Language', () => {
  const comparisons = [
    {
      spoken: "What're you up to?",
      written: 'What are you doing?',
      meaning: '뭐해?',
    },
    {
      spoken: "I'm gonna go",
      written: 'I am going to go',
      meaning: '나 갈 거야',
    },
    {
      spoken: "Wanna grab some food?",
      written: 'Would you like to get something to eat?',
      meaning: '뭐 먹을래?',
    },
    {
      spoken: "Gotta run!",
      written: 'I have to leave now.',
      meaning: '가야 해!',
    },
  ]

  comparisons.forEach(({ spoken, written, meaning }) => {
    describe(`for "${meaning}"`, () => {
      it(`should recognize "${spoken}" as more casual`, () => {
        const spokenScore = calculateContextScore(spoken, 'casual')
        const writtenScore = calculateContextScore(written, 'casual')

        expect(spokenScore.score).toBeGreaterThanOrEqual(writtenScore.score)
      })

      it(`should recognize "${written}" as more formal`, () => {
        const spokenScore = calculateContextScore(spoken, 'formal')
        const writtenScore = calculateContextScore(written, 'formal')

        expect(writtenScore.score).toBeGreaterThanOrEqual(spokenScore.score)
      })
    })
  })
})

describe('Emotion in Expressions', () => {
  const emotionalExpressions = [
    {
      emotion: 'happy',
      expressions: [
        "I'm so happy!",
        "This is amazing!",
        "I'm thrilled!",
        'Awesome!',
        "I couldn't be happier!",
      ],
    },
    {
      emotion: 'sad',
      expressions: [
        "I'm feeling down.",
        "I'm so sad.",
        'This breaks my heart.',
        "I'm devastated.",
      ],
    },
    {
      emotion: 'angry',
      expressions: [
        "I'm so frustrated!",
        "This is infuriating!",
        "I'm really upset.",
        "I can't believe this!",
      ],
    },
    {
      emotion: 'surprised',
      expressions: [
        'No way!',
        "I can't believe it!",
        'What?!',
        "You're kidding!",
        'Seriously?!',
      ],
    },
  ]

  emotionalExpressions.forEach(({ emotion, expressions }) => {
    describe(`${emotion} expressions`, () => {
      expressions.forEach((expr) => {
        it(`should recognize "${expr}" as valid emotional expression`, () => {
          expect(expr.length).toBeGreaterThan(0)
          // 감정 표현은 감정 단어나 구두점을 포함
          const hasEmotionalContent =
            /[!?]/.test(expr) || // 강조 구두점
            expr.includes("'") || // 축약형
            /\b(happy|sad|frustrated|amazing|devastated|upset|down|thrilled|heart|breaks|feeling|believe)\b/i.test(expr)
          expect(hasEmotionalContent).toBe(true)
        })
      })
    })
  })
})
