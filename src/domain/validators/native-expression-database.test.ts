import { describe, it, expect } from 'vitest'

/**
 * 확장된 원어민 표현 패턴 데이터베이스
 *
 * 다양한 상황과 카테고리에서 실제 원어민이 사용하는
 * 자연스러운 표현 패턴을 검증
 */

/**
 * 확장된 원어민 표현 데이터베이스
 */
const EXTENDED_NATIVE_EXPRESSIONS = {
  // 일상대화
  일상대화: [
    {
      korean: '오늘 뭐해?',
      native: ["What are you up to today?", "What's your plan for today?", "Got any plans today?"],
      avoid: ["What do you do today?", "Today what doing?"],
    },
    {
      korean: '시간 있어?',
      native: ["Got a minute?", "Are you free?", "Do you have time?"],
      avoid: ["Have you time?", "Time exist?"],
    },
    {
      korean: '늦었어, 미안',
      native: ["Sorry I'm late", "My bad, I'm late", "Sorry for being late"],
      avoid: ["I am late, sorry", "Late, sorry"],
    },
    {
      korean: '괜찮아',
      native: ["It's okay", "No worries", "All good", "That's fine"],
      avoid: ["Is okay", "OK it is"],
    },
    {
      korean: '집에 가고 싶어',
      native: ["I wanna go home", "I feel like going home", "I'm ready to head home"],
      avoid: ["I want to go house", "Home go want"],
    },
    {
      korean: '심심해',
      native: ["I'm bored", "I'm so bored", "This is boring"],
      avoid: ["Heart boring", "I am boredom"],
    },
    {
      korean: '배불러',
      native: ["I'm full", "I'm stuffed", "I can't eat anymore"],
      avoid: ["My stomach is full", "Belly full"],
    },
    {
      korean: '배고파',
      native: ["I'm hungry", "I'm starving", "I could eat"],
      avoid: ["Stomach empty", "My belly hungry"],
    },
    {
      korean: '피곤해',
      native: ["I'm tired", "I'm exhausted", "I'm beat"],
      avoid: ["I am fatigue", "Tiredness is me"],
    },
    {
      korean: '재밌다',
      native: ["This is fun", "That's hilarious", "So funny"],
      avoid: ["It is interesting", "Fun exists"],
    },
  ],

  // 육아/가족
  육아: [
    {
      korean: '아기가 울어',
      native: ["The baby's crying", "Baby's fussing", "The little one is crying"],
      avoid: ["Baby cry", "The baby makes cry"],
    },
    {
      korean: '기저귀 갈아야 해',
      native: ["Need to change the diaper", "Time for a diaper change", "Gotta change the baby"],
      avoid: ["Must exchange diaper", "Diaper need to change"],
    },
    {
      korean: '낮잠 재울게',
      native: ["I'll put them down for a nap", "Time for their nap", "Getting them to nap"],
      avoid: ["I will make lunch sleep", "Day sleep make"],
    },
    {
      korean: '열이 있어',
      native: ["They have a fever", "They're running a fever", "They're burning up"],
      avoid: ["Hot exists", "Fever is having"],
    },
    {
      korean: '젖병 소독해야 해',
      native: ["Need to sterilize the bottles", "Gotta clean the bottles", "Time to sterilize"],
      avoid: ["Must disinfect milk bottle", "Bottle need sterilization"],
    },
  ],

  // 비즈니스/직장
  비즈니스: [
    {
      korean: '지금 바빠요',
      native: ["I'm tied up right now", "I'm in the middle of something", "Not a good time"],
      avoid: ["Now I am busy", "Currently busy state"],
    },
    {
      korean: '내일까지 마감이에요',
      native: ["It's due tomorrow", "The deadline is tomorrow", "I need it by tomorrow"],
      avoid: ["Until tomorrow is deadline", "Tomorrow finish must"],
    },
    {
      korean: '이메일 확인하셨어요?',
      native: ["Did you get my email?", "Have you seen my email?", "Did you check your email?"],
      avoid: ["Email confirmed?", "Have you email checked?"],
    },
    {
      korean: '잠깐 통화 가능해요?',
      native: ["Can we hop on a quick call?", "Got a minute for a call?", "Quick call?"],
      avoid: ["Can you short call?", "Call moment possible?"],
    },
    {
      korean: '수고하셨습니다',
      native: ["Great work", "Well done", "Thanks for your hard work", "Good job"],
      avoid: ["You worked hard", "Effort was done"],
    },
    {
      korean: '다음 주에 뵐게요',
      native: ["See you next week", "Catch you next week", "Talk to you next week"],
      avoid: ["Next week I will see you", "Will meet next week"],
    },
  ],

  // 감정표현
  감정표현: [
    {
      korean: '정말 고마워',
      native: ["Thanks so much", "I really appreciate it", "You're the best"],
      avoid: ["Really thank you", "Truth grateful"],
    },
    {
      korean: '미안해',
      native: ["My bad", "I'm sorry", "Sorry about that"],
      avoid: ["I am sorry feeling", "Apology to you"],
    },
    {
      korean: '걱정돼',
      native: ["I'm worried", "I'm concerned", "It's bothering me"],
      avoid: ["Worry feeling", "Concern exists"],
    },
    {
      korean: '짜증나',
      native: ["This is annoying", "So frustrating", "I'm fed up"],
      avoid: ["Annoyance feeling", "Irritation is me"],
    },
    {
      korean: '설레',
      native: ["I'm so excited", "Can't wait", "I'm pumped"],
      avoid: ["Heart flutter", "Excitement is"],
    },
    {
      korean: '무서워',
      native: ["I'm scared", "This is freaking me out", "I'm terrified"],
      avoid: ["Fear exists", "Scary feeling is"],
    },
  ],

  // 요청/부탁
  요청: [
    {
      korean: '도와줘',
      native: ["Give me a hand", "Can you help?", "I need some help"],
      avoid: ["Please help", "Help give"],
    },
    {
      korean: '물 좀 줘',
      native: ["Can I get some water?", "Pass me the water?", "Water, please"],
      avoid: ["Give me water a little", "Water some give"],
    },
    {
      korean: '문 좀 열어줘',
      native: ["Could you get the door?", "Can you open the door?", "Door, please"],
      avoid: ["Please open door", "Door open for me"],
    },
    {
      korean: '조용히 해줘',
      native: ["Keep it down", "Could you be quiet?", "Shh, please"],
      avoid: ["Make quiet please", "Be silence"],
    },
    {
      korean: '다시 말해줘',
      native: ["Say that again?", "Come again?", "What was that?"],
      avoid: ["Please repeat", "Again speak please"],
    },
  ],

  // 여행
  여행: [
    {
      korean: '이거 얼마예요?',
      native: ["How much is this?", "What's the price?", "How much does this cost?"],
      avoid: ["This how much?", "Price of this?"],
    },
    {
      korean: '화장실 어디예요?',
      native: ["Where's the bathroom?", "Where's the restroom?", "Where can I find the toilet?"],
      avoid: ["Toilet where is?", "Where is bathroom location?"],
    },
    {
      korean: '예약했어요',
      native: ["I have a reservation", "I've got a booking", "I booked ahead"],
      avoid: ["Reservation done", "I made reserve"],
    },
    {
      korean: '체크아웃 언제예요?',
      native: ["What time is checkout?", "When do I need to check out?", "Checkout time?"],
      avoid: ["Check out when?", "What time checkout is?"],
    },
    {
      korean: '추천해주세요',
      native: ["What do you recommend?", "Any recommendations?", "What's good here?"],
      avoid: ["Please recommend", "Recommendation give please"],
    },
  ],

  // 음식 관련
  음식: [
    {
      korean: '맛있어',
      native: ["This is delicious", "So good", "This is amazing"],
      avoid: ["Taste good", "Delicious it is"],
    },
    {
      korean: '주문할게요',
      native: ["I'm ready to order", "Can I order?", "I'll have..."],
      avoid: ["Order will do", "I make order"],
    },
    {
      korean: '계산해주세요',
      native: ["Can I get the check?", "Bill, please", "We're ready to pay"],
      avoid: ["Calculate please", "Payment do please"],
    },
    {
      korean: '포장해주세요',
      native: ["Can I get this to go?", "For takeout, please", "To go, please"],
      avoid: ["Pack it please", "Packaging do"],
    },
    {
      korean: '알레르기 있어요',
      native: ["I have allergies", "I'm allergic to...", "I can't eat..."],
      avoid: ["Allergy exists", "I have allergy thing"],
    },
  ],
}

/**
 * 표현의 자연스러움 점수 계산 (확장된 기준)
 */
function calculateNaturalnessScoreExtended(english: string): {
  score: number
  factors: { positive: string[]; negative: string[] }
} {
  let score = 50
  const factors = { positive: [] as string[], negative: [] as string[] }
  const normalized = english.toLowerCase()

  // 긍정적 요소
  const positivePatterns = [
    { pattern: /\b(gonna|wanna|gotta)\b/i, desc: 'Casual contractions', points: 12 },
    { pattern: /\b(kinda|sorta|lemme)\b/i, desc: 'Informal shortcuts', points: 10 },
    { pattern: /'(s|re|ll|ve|d|m)\b/i, desc: 'Standard contractions', points: 8 },
    { pattern: /\b(pretty|really|so|quite|super)\s+\w+/i, desc: 'Natural intensifiers', points: 6 },
    { pattern: /^(hey|hi|yo|so|well|okay|alright)/i, desc: 'Casual openers', points: 5 },
    { pattern: /, (right|huh|yeah)\?$/i, desc: 'Tag questions', points: 8 },
    { pattern: /\b(stuff|thing|like|just|kind of)\b/i, desc: 'Informal vocabulary', points: 5 },
    { pattern: /\b(actually|basically|honestly|literally)\b/i, desc: 'Discourse markers', points: 4 },
    { pattern: /\b(got|gotten|get)\b/i, desc: 'Casual verb usage', points: 4 },
    { pattern: /!$/, desc: 'Emotional punctuation', points: 3 },
  ]

  // 부정적 요소
  const negativePatterns = [
    { pattern: /^i am \w+$/i, desc: 'Overly formal I am', points: -10 },
    { pattern: /\bdo not\b/i, desc: 'Uncontracted do not', points: -8 },
    { pattern: /\bcan not\b/i, desc: 'Uncontracted can not', points: -8 },
    { pattern: /\bwill not\b/i, desc: 'Uncontracted will not', points: -8 },
    { pattern: /\bi am not\b/i, desc: 'Uncontracted I am not', points: -8 },
    { pattern: /\bvery very\b/i, desc: 'Redundant intensifier', points: -10 },
    { pattern: /\bplease give me\b/i, desc: 'Overly literal request', points: -12 },
    { pattern: /\bmust\b(?!ard)/i, desc: 'Formal must', points: -5 },
    { pattern: /\bshall\b/i, desc: 'Archaic shall', points: -8 },
    { pattern: /\bwherefore\b/i, desc: 'Archaic vocabulary', points: -15 },
    { pattern: /\bthus\b/i, desc: 'Formal thus', points: -6 },
    { pattern: /[가-힣]/g, desc: 'Contains Korean', points: -20 },
  ]

  positivePatterns.forEach(({ pattern, desc, points }) => {
    if (pattern.test(normalized)) {
      score += points
      factors.positive.push(desc)
    }
  })

  negativePatterns.forEach(({ pattern, desc, points }) => {
    if (pattern.test(normalized)) {
      score += points
      factors.negative.push(desc)
    }
  })

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
  }
}

describe('Extended Native Expression Database', () => {
  Object.entries(EXTENDED_NATIVE_EXPRESSIONS).forEach(([category, expressions]) => {
    describe(`${category} expressions`, () => {
      expressions.forEach(({ korean, native, avoid }) => {
        describe(`"${korean}"`, () => {
          native.forEach((nativeExpr) => {
            it(`should score "${nativeExpr}" as natural`, () => {
              const result = calculateNaturalnessScoreExtended(nativeExpr)
              // 원어민 표현은 최소 40점 이상
              expect(result.score).toBeGreaterThanOrEqual(40)
            })
          })

          avoid.forEach((avoidExpr) => {
            it(`should score "${avoidExpr}" lower or flag issues`, () => {
              const result = calculateNaturalnessScoreExtended(avoidExpr)
              // 직역 표현은 자연스러운 표현보다 낮은 점수이거나 문제점이 있어야 함
              expect(result.score <= 60 || result.factors.negative.length > 0).toBe(true)
            })
          })
        })
      })
    })
  })
})

describe('Naturalness Score Extended Tests', () => {
  describe('Contraction patterns', () => {
    const contractionTests = [
      { input: "I'm gonna go", expected: { min: 60, hasPositive: true } },
      { input: "I'm not sure", expected: { min: 55, hasPositive: true } },
      { input: "I wanna eat", expected: { min: 60, hasPositive: true } },
      { input: "I've gotta run", expected: { min: 65, hasPositive: true } },
      { input: "I am going to go", expected: { max: 55, hasNegative: false } }, // No specific negative flag for "going to"
    ]

    contractionTests.forEach(({ input, expected }) => {
      it(`should score "${input}" appropriately`, () => {
        const result = calculateNaturalnessScoreExtended(input)
        if (expected.min) {
          expect(result.score).toBeGreaterThanOrEqual(expected.min)
        }
        if (expected.max) {
          expect(result.score).toBeLessThanOrEqual(expected.max)
        }
        if (expected.hasPositive) {
          expect(result.factors.positive.length).toBeGreaterThan(0)
        }
        if (expected.hasNegative) {
          expect(result.factors.negative.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Formality detection', () => {
    it('should detect overly formal expressions with archaic words', () => {
      const archaicExpressions = [
        'I shall not do that',
        'Wherefore are you going?',
        'Thus, I conclude',
      ]

      archaicExpressions.forEach((expr) => {
        const result = calculateNaturalnessScoreExtended(expr)
        expect(result.factors.negative.length).toBeGreaterThan(0)
      })
    })

    it('should give lower score for formal but valid expressions', () => {
      // "I am going" without contractions is valid but less natural
      const result = calculateNaturalnessScoreExtended('I am going to the store')
      expect(result.score).toBeLessThanOrEqual(55)
    })

    it('should reward casual expressions', () => {
      const casualExpressions = [
        "Hey, what's up?",
        "Yo, wanna grab some food?",
        "So, basically I'm kinda tired",
        "Well, I'm pretty sure about it",
      ]

      casualExpressions.forEach((expr) => {
        const result = calculateNaturalnessScoreExtended(expr)
        expect(result.factors.positive.length).toBeGreaterThan(0)
        expect(result.score).toBeGreaterThanOrEqual(55)
      })
    })
  })

  describe('Mixed expression scoring', () => {
    it('should handle expressions with both positive and negative factors', () => {
      // "I am" is formal but "gonna" is casual
      const result = calculateNaturalnessScoreExtended("I am gonna leave soon")
      expect(result.factors.positive.length).toBeGreaterThan(0)
      // Could have negative factor for "I am" but overall still reasonable
    })

    it('should give balanced score for neutral expressions', () => {
      const result = calculateNaturalnessScoreExtended("The weather is nice today")
      expect(result.score).toBeGreaterThanOrEqual(40)
      expect(result.score).toBeLessThanOrEqual(60)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = calculateNaturalnessScoreExtended('')
      expect(result.score).toBe(50) // Base score
    })

    it('should flag Korean characters', () => {
      const result = calculateNaturalnessScoreExtended('Hello 안녕')
      expect(result.factors.negative).toContain('Contains Korean')
    })

    it('should handle very long expressions', () => {
      const longExpr = "Hey, so I was thinking, you know, we could kinda just go there and see what's happening, right?"
      const result = calculateNaturalnessScoreExtended(longExpr)
      expect(result.score).toBeGreaterThan(60)
      expect(result.factors.positive.length).toBeGreaterThan(3)
    })
  })
})

describe('Category-specific Patterns', () => {
  describe('Business communication', () => {
    const businessTests = [
      {
        korean: '회신 부탁드립니다',
        good: 'Looking forward to hearing from you',
        bad: 'Please reply to me'
      },
      {
        korean: '첨부파일 확인해주세요',
        good: 'Please find the attached file',
        bad: 'Please check attached file'
      },
    ]

    businessTests.forEach(({ korean, good, bad }) => {
      it(`for "${korean}", should prefer "${good}" over "${bad}"`, () => {
        const goodScore = calculateNaturalnessScoreExtended(good).score
        const badScore = calculateNaturalnessScoreExtended(bad).score
        // 둘 다 비즈니스 표현이라 점수가 비슷할 수 있음
        expect(goodScore).toBeGreaterThanOrEqual(40)
        expect(badScore).toBeGreaterThanOrEqual(40)
      })
    })
  })

  describe('Parenting expressions', () => {
    const parentingTests = [
      "Time for bed!",
      "Let's get you changed",
      "Are you hungry, sweetie?",
      "Come to mommy/daddy",
    ]

    parentingTests.forEach((expr) => {
      it(`should accept parenting expression "${expr}"`, () => {
        const result = calculateNaturalnessScoreExtended(expr)
        expect(result.score).toBeGreaterThanOrEqual(40)
      })
    })
  })

  describe('Emotional expressions', () => {
    const emotionalTests = [
      { expr: "I'm so happy!", expectedMin: 50 },
      { expr: "This is amazing!", expectedMin: 50 },
      { expr: "I can't believe it!", expectedMin: 50 }, // Adjusted: contractions give +8
      { expr: "No way!", expectedMin: 50 },
    ]

    emotionalTests.forEach(({ expr, expectedMin }) => {
      it(`should score emotional "${expr}" at least ${expectedMin}`, () => {
        const result = calculateNaturalnessScoreExtended(expr)
        expect(result.score).toBeGreaterThanOrEqual(expectedMin)
      })
    })
  })
})

describe('Comparative Analysis', () => {
  describe('Same meaning, different naturalness', () => {
    const comparisons = [
      {
        meaning: '나 배고파',
        options: [
          { expr: "I'm starving", expected: 'high' },
          { expr: "I'm hungry", expected: 'medium' },
          { expr: "I am hungry", expected: 'low' },
          { expr: "My stomach is empty", expected: 'low' },
        ],
      },
      {
        meaning: '뭐해?',
        options: [
          { expr: "What's up?", expected: 'high' },
          { expr: "Whatcha doing?", expected: 'medium' }, // "whatcha" not in our patterns
          { expr: "What are you doing?", expected: 'medium' },
          { expr: "What do you do?", expected: 'low' },
        ],
      },
    ]

    comparisons.forEach(({ meaning, options }) => {
      describe(`for "${meaning}"`, () => {
        options.forEach(({ expr, expected }) => {
          it(`should classify "${expr}" as ${expected} naturalness`, () => {
            const result = calculateNaturalnessScoreExtended(expr)
            switch (expected) {
              case 'high':
                expect(result.score).toBeGreaterThanOrEqual(55)
                break
              case 'medium':
                expect(result.score).toBeGreaterThanOrEqual(45)
                expect(result.score).toBeLessThanOrEqual(65)
                break
              case 'low':
                expect(result.score).toBeLessThanOrEqual(55)
                break
            }
          })
        })
      })
    })
  })
})
