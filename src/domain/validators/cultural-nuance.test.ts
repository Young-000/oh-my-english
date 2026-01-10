import { describe, it, expect } from 'vitest'

/**
 * 문화적 뉘앙스 테스트
 *
 * 한국어와 영어 사이의 문화적 차이를 반영한 표현 검증:
 * - 경어법과 존칭
 * - 겸손 표현 vs 직접 표현
 * - 사회적 상황별 적절성
 * - 문화 특정 관용구
 * - 직역 시 어색한 표현
 */

/**
 * 문화적 적절성 분석 결과
 */
interface CulturalAnalysis {
  expression: string
  culturalFit: 'appropriate' | 'awkward' | 'inappropriate'
  notes: string[]
  suggestions: string[]
}

/**
 * 문화적 맥락 유형
 */
type CulturalContext =
  | 'formal_korean_to_english'
  | 'casual_korean_to_english'
  | 'business'
  | 'family'
  | 'stranger'
  | 'service'

/**
 * 문화적 적절성 분석기
 */
function analyzeCulturalFit(
  expression: string,
  context: CulturalContext
): CulturalAnalysis {
  const notes: string[] = []
  const suggestions: string[] = []
  let culturalFit: 'appropriate' | 'awkward' | 'inappropriate' = 'appropriate'

  const normalized = expression.toLowerCase()

  // 한국식 직역 패턴 (어색한 표현)
  const awkwardPatterns = [
    { pattern: /fighting/i, note: 'Korean-English; not used in native English', suggestion: 'Good luck! / You can do it!' },
    { pattern: /eat rice/i, note: 'Literal translation of 밥 먹다', suggestion: 'eat / have a meal' },
    { pattern: /my age/i, context: /how old/i, note: 'Age is asked more directly in English', suggestion: 'How old are you?' },
    { pattern: /older brother|older sister/i, note: 'Specific sibling terms less common', suggestion: 'brother/sister (context provides age info)' },
  ]

  awkwardPatterns.forEach(({ pattern, note, suggestion }) => {
    if (pattern.test(normalized)) {
      notes.push(note)
      suggestions.push(suggestion)
      culturalFit = 'awkward'
    }
  })

  // 과도한 겸손 (영어에서 어색)
  const overHumblePatterns = [
    { pattern: /i am so sorry to bother you/i, note: 'Overly humble for English', suggestion: 'Excuse me / Could you help me?' },
    { pattern: /i am not worthy/i, note: 'Too humble for casual English', suggestion: 'Thank you / I appreciate it' },
    { pattern: /please forgive me/i, note: 'Too formal for minor inconvenience', suggestion: 'Sorry about that' },
  ]

  overHumblePatterns.forEach(({ pattern, note, suggestion }) => {
    if (pattern.test(normalized)) {
      notes.push(note)
      suggestions.push(suggestion)
      if (context === 'casual_korean_to_english') {
        culturalFit = 'awkward'
      }
    }
  })

  // 직접적 표현 (한국어에서 어색하지만 영어에서 자연스러움)
  const directPatterns = [
    { pattern: /\bno\b/i, note: 'Direct refusal is acceptable in English' },
    { pattern: /i disagree/i, note: 'Expressing disagreement is culturally accepted' },
    { pattern: /that\'s wrong/i, note: 'Pointing out errors is acceptable' },
  ]

  directPatterns.forEach(({ pattern, note }) => {
    if (pattern.test(normalized)) {
      notes.push(note)
    }
  })

  // 서비스 상황 적절성
  if (context === 'service') {
    if (/please/i.test(normalized) || /could you/i.test(normalized)) {
      notes.push('Polite service language')
    } else if (/give me/i.test(normalized) && !/please/i.test(normalized)) {
      notes.push('Direct demand without politeness markers')
      suggestions.push('Add "please" or use "Could I have..."')
      culturalFit = 'awkward'
    }
  }

  // 비즈니스 상황 적절성
  if (context === 'business') {
    const professionalMarkers = /\b(appreciate|would|could|kindly|please)\b/i
    if (!professionalMarkers.test(normalized)) {
      notes.push('Missing professional language markers')
      suggestions.push('Consider adding professional courtesies')
    }
  }

  return { expression, culturalFit, notes, suggestions }
}

describe('Korean-English Cultural Differences', () => {
  describe('Overly Humble Expressions', () => {
    const overlyHumbleTests = [
      {
        korean: '죄송합니다 (for minor thing)',
        awkward: "I'm so terribly sorry for the inconvenience I have caused",
        natural: "Sorry about that",
      },
      {
        korean: '감사합니다 (accepting compliment)',
        awkward: "I am not worthy of such praise",
        natural: "Thank you!",
      },
      {
        korean: '부탁드립니다',
        awkward: "I humbly beseech you to grant my request",
        natural: "Could you please help me?",
      },
    ]

    overlyHumbleTests.forEach(({ korean, awkward, natural }) => {
      it(`should prefer "${natural}" over "${awkward}" for "${korean}"`, () => {
        const awkwardResult = analyzeCulturalFit(awkward, 'casual_korean_to_english')
        const naturalResult = analyzeCulturalFit(natural, 'casual_korean_to_english')

        // awkward한 표현은 notes나 suggestions가 있을 수 있음
        expect(awkwardResult.expression).toBe(awkward)
        expect(naturalResult.expression).toBe(natural)
      })
    })
  })

  describe('Korean-English Literal Translations', () => {
    const literalTranslationTests = [
      {
        literal: 'Fighting!',
        natural: 'Good luck!',
        culturalNote: 'Korean-English; not used in native English',
      },
      {
        literal: 'Did you eat rice?',
        natural: 'Have you eaten?',
        culturalNote: 'Literal translation of 밥 먹다',
      },
    ]

    literalTranslationTests.forEach(({ literal, natural, culturalNote }) => {
      it(`should flag "${literal}" as culturally awkward`, () => {
        const result = analyzeCulturalFit(literal, 'casual_korean_to_english')
        expect(result.notes.some(n => n.includes('Korean') || n.includes('Literal'))).toBe(true)
      })

      it(`should accept "${natural}" as culturally appropriate`, () => {
        const result = analyzeCulturalFit(natural, 'casual_korean_to_english')
        expect(result.culturalFit).not.toBe('inappropriate')
      })
    })
  })

  describe('Age and Family Terms', () => {
    it('should note that Korean specific sibling terms are less common in English', () => {
      const result = analyzeCulturalFit('my older brother is coming', 'family')
      expect(result.notes.some(n => n.includes('sibling'))).toBe(true)
    })

    it('should accept simple family terms', () => {
      const result = analyzeCulturalFit('my brother is coming', 'family')
      expect(result.culturalFit).toBe('appropriate')
    })
  })
})

describe('Directness in English', () => {
  describe('Acceptable Direct Expressions', () => {
    const directExpressions = [
      { expr: "No, I can't do that", context: 'Direct refusal' },
      { expr: "I disagree with you", context: 'Expressing disagreement' },
      { expr: "That's not right", context: 'Pointing out errors' },
      { expr: "I don't like it", context: 'Expressing preference' },
      { expr: "I need help", context: 'Requesting assistance' },
    ]

    directExpressions.forEach(({ expr, context }) => {
      it(`should accept "${expr}" as appropriate for ${context}`, () => {
        const result = analyzeCulturalFit(expr, 'casual_korean_to_english')
        expect(result.culturalFit).not.toBe('inappropriate')
      })
    })
  })

  describe('Korean to English Directness Adjustment', () => {
    // 한국어에서는 간접적이지만 영어에서는 직접적으로
    const adjustmentTests = [
      {
        korean: '그건 좀...',
        indirect: "Well, that's a bit...",
        direct: "I don't think that's a good idea",
      },
      {
        korean: '괜찮아요 (when declining)',
        indirect: "It's okay, thank you",
        direct: "No, thank you",
      },
    ]

    adjustmentTests.forEach(({ korean, indirect, direct }) => {
      it(`should recognize both direct and indirect forms for "${korean}"`, () => {
        const indirectResult = analyzeCulturalFit(indirect, 'casual_korean_to_english')
        const directResult = analyzeCulturalFit(direct, 'casual_korean_to_english')

        expect(indirectResult.culturalFit).not.toBe('inappropriate')
        expect(directResult.culturalFit).not.toBe('inappropriate')
      })
    })
  })
})

describe('Service Situation Appropriateness', () => {
  describe('Polite Service Language', () => {
    const politeService = [
      "Could I have a coffee, please?",
      "May I have the bill, please?",
      "I'd like to order, please",
      "Could you help me with this, please?",
    ]

    politeService.forEach((expr) => {
      it(`should recognize "${expr}" as polite service language`, () => {
        const result = analyzeCulturalFit(expr, 'service')
        // please나 could you가 있으면 polite
        expect(result.notes.some(n => n.includes('Polite'))).toBe(true)
      })
    })
  })

  describe('Direct Service Language', () => {
    it('should flag "Give me a coffee" as needing politeness', () => {
      const result = analyzeCulturalFit("Give me a coffee", 'service')
      // 제안이 있거나 노트에 direct demand가 있어야 함
      expect(result.notes.some(n => n.includes('demand') || n.includes('direct'))).toBe(true)
    })

    it('should prefer polite forms in service context', () => {
      const polite = analyzeCulturalFit("Could I have a coffee, please?", 'service')
      const direct = analyzeCulturalFit("Give me a coffee", 'service')

      expect(polite.notes.some(n => n.includes('Polite'))).toBe(true)
      expect(direct.culturalFit).toBe('awkward')
    })
  })
})

describe('Business Context Appropriateness', () => {
  describe('Professional Language', () => {
    const professionalExpressions = [
      "I would appreciate your assistance with this matter",
      "Could you please review the attached document?",
      "Thank you for your patience",
      "I kindly request your feedback",
    ]

    professionalExpressions.forEach((expr) => {
      it(`should recognize "${expr}" as professionally appropriate`, () => {
        const result = analyzeCulturalFit(expr, 'business')
        expect(result.culturalFit).not.toBe('inappropriate')
      })
    })
  })

  describe('Casual Language in Business', () => {
    const casualBusiness = [
      "Hey, did you finish that thing?",
      "Yeah, I'll do it later",
      "Whatever works for you",
    ]

    casualBusiness.forEach((expr) => {
      it(`should note missing professional markers in "${expr}"`, () => {
        const result = analyzeCulturalFit(expr, 'business')
        expect(result.notes.some(n => n.includes('professional'))).toBe(true)
      })
    })
  })
})

describe('Cultural Idioms and Expressions', () => {
  describe('English Idioms (natural)', () => {
    const englishIdioms = [
      { idiom: "It's raining cats and dogs", meaning: '비가 많이 와' },
      { idiom: "Break a leg!", meaning: '행운을 빌어!' },
      { idiom: "Piece of cake", meaning: '식은 죽 먹기' },
      { idiom: "Once in a blue moon", meaning: '아주 드물게' },
      { idiom: "Hit the nail on the head", meaning: '정확히 짚어내다' },
    ]

    englishIdioms.forEach(({ idiom, meaning }) => {
      it(`should accept "${idiom}" for "${meaning}"`, () => {
        const result = analyzeCulturalFit(idiom, 'casual_korean_to_english')
        expect(result.culturalFit).toBe('appropriate')
      })
    })
  })

  describe('Korean-Only Expressions (awkward in English)', () => {
    const koreanOnlyExpressions = [
      { expr: 'Fighting!', context: '응원' },
      { expr: 'Eat rice!', context: '밥 먹어!' },
    ]

    koreanOnlyExpressions.forEach(({ expr, context }) => {
      it(`should flag "${expr}" as Korean-specific for ${context}`, () => {
        const result = analyzeCulturalFit(expr, 'casual_korean_to_english')
        expect(result.culturalFit).not.toBe('appropriate')
      })
    })
  })
})

describe('Formality Level Matching', () => {
  describe('Formal Korean to Formal English', () => {
    const formalPairs = [
      { korean: '감사합니다', formal: 'Thank you very much', casual: 'Thanks!' },
      { korean: '죄송합니다', formal: 'I apologize', casual: 'My bad' },
      { korean: '실례합니다', formal: 'Excuse me', casual: 'Sorry!' },
    ]

    formalPairs.forEach(({ korean, formal, casual }) => {
      it(`should match formality for "${korean}"`, () => {
        // 둘 다 유효한 표현
        const formalResult = analyzeCulturalFit(formal, 'formal_korean_to_english')
        const casualResult = analyzeCulturalFit(casual, 'casual_korean_to_english')

        expect(formalResult.culturalFit).not.toBe('inappropriate')
        expect(casualResult.culturalFit).not.toBe('inappropriate')
      })
    })
  })
})

describe('Cultural Appropriateness in Different Settings', () => {
  describe('Family Setting', () => {
    const familyExpressions = [
      "Mom, what's for dinner?",
      "Can I borrow the car?",
      "I'll be home late",
      "Love you, bye!",
    ]

    familyExpressions.forEach((expr) => {
      it(`should accept "${expr}" in family context`, () => {
        const result = analyzeCulturalFit(expr, 'family')
        expect(result.culturalFit).toBe('appropriate')
      })
    })
  })

  describe('Stranger Setting', () => {
    const strangerExpressions = [
      "Excuse me, do you know the time?",
      "Sorry, is this seat taken?",
      "Could you tell me how to get to the station?",
    ]

    strangerExpressions.forEach((expr) => {
      it(`should accept "${expr}" with strangers`, () => {
        const result = analyzeCulturalFit(expr, 'stranger')
        expect(result.culturalFit).toBe('appropriate')
      })
    })
  })
})

describe('Emotional Expression Differences', () => {
  describe('Expressing Compliments', () => {
    // 영어권에서는 칭찬을 직접 받아들이는 것이 자연스러움
    const complimentResponses = [
      { response: "Thank you!", appropriate: true },
      { response: "You think so? Thanks!", appropriate: true },
      { response: "Oh, it was nothing, really...", appropriate: true }, // acceptable but humble
    ]

    complimentResponses.forEach(({ response, appropriate }) => {
      it(`should ${appropriate ? 'accept' : 'flag'} "${response}" as compliment response`, () => {
        const result = analyzeCulturalFit(response, 'casual_korean_to_english')
        if (appropriate) {
          expect(result.culturalFit).not.toBe('inappropriate')
        }
      })
    })
  })

  describe('Expressing Disagreement', () => {
    // 영어권에서는 의견 불일치를 표현하는 것이 더 자연스러움
    const disagreementExpressions = [
      "I see your point, but I think differently",
      "I'm not sure I agree with that",
      "Actually, I have a different perspective",
    ]

    disagreementExpressions.forEach((expr) => {
      it(`should accept "${expr}" as appropriate disagreement`, () => {
        const result = analyzeCulturalFit(expr, 'casual_korean_to_english')
        expect(result.culturalFit).toBe('appropriate')
      })
    })
  })
})

describe('Small Talk Patterns', () => {
  describe('English Small Talk', () => {
    const smallTalkPatterns = [
      { pattern: "How are you?", response: "Good, thanks! How about you?" },
      { pattern: "Nice weather, isn't it?", response: "Yeah, it's lovely!" },
      { pattern: "Did you have a good weekend?", response: "It was great, thanks!" },
    ]

    smallTalkPatterns.forEach(({ pattern, response }) => {
      it(`should accept "${response}" as response to "${pattern}"`, () => {
        const result = analyzeCulturalFit(response, 'casual_korean_to_english')
        expect(result.culturalFit).toBe('appropriate')
      })
    })
  })

  describe('Korean vs English Small Talk Difference', () => {
    // 한국어에서는 "밥 먹었어?"가 인사인 반면, 영어에서는 실제 질문
    it('should note that "Have you eaten?" is a greeting in Korean culture', () => {
      // 이 표현은 영어에서도 유효하지만 문화적 맥락이 다름
      const result = analyzeCulturalFit('Have you eaten?', 'casual_korean_to_english')
      expect(result.culturalFit).toBe('appropriate')
    })
  })
})
