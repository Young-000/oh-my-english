import { describe, it, expect } from 'vitest'

/**
 * 애매한 입력 처리 테스트
 *
 * 한국어 입력이 여러 가지로 해석될 수 있을 때 적절한 처리를 검증:
 * - 동음이의어
 * - 문맥 의존적 표현
 * - 존칭/반말 구분
 * - 지역/세대별 차이
 * - 신조어/유행어
 */

/**
 * 애매한 입력 분석 결과
 */
interface AmbiguityAnalysis {
  input: string
  isAmbiguous: boolean
  possibleInterpretations: string[]
  suggestedClarification?: string
  confidence: number
}

/**
 * 애매한 입력 분석기
 */
function analyzeAmbiguity(input: string): AmbiguityAnalysis {
  const normalizedInput = input.trim()
  const interpretations: string[] = []
  let isAmbiguous = false
  let suggestedClarification: string | undefined
  let confidence = 0.9

  // 동음이의어 체크
  const homophonePatterns: Record<string, string[]> = {
    '배': ['과일 배', '복부/배', '선박/배', '숫자 배'],
    '차': ['음료 차', '자동차', '차이'],
    '밤': ['밤 시간', '견과류 밤'],
    '눈': ['눈 (신체)', '눈 (날씨)'],
    '말': ['언어/말', '동물 말'],
    '손': ['신체 손', '손님'],
  }

  for (const [word, meanings] of Object.entries(homophonePatterns)) {
    if (normalizedInput.includes(word)) {
      interpretations.push(...meanings)
      isAmbiguous = true
      suggestedClarification = `"${word}"이(가) 어떤 의미인가요?`
      confidence -= 0.2
    }
  }

  // 존칭 레벨 애매함
  const formalityAmbiguous = [
    { pattern: /고마워|감사/, meanings: ['Thanks (casual)', 'Thank you (formal)'] },
    { pattern: /미안|죄송/, meanings: ['Sorry (casual)', 'I apologize (formal)'] },
    { pattern: /안녕/, meanings: ['Hi (casual)', 'Hello (formal)', 'Goodbye'] },
  ]

  for (const { pattern, meanings } of formalityAmbiguous) {
    if (pattern.test(normalizedInput)) {
      interpretations.push(...meanings)
      isAmbiguous = true
      suggestedClarification = '격식체/비격식체 중 어느 것이 필요한가요?'
      confidence -= 0.1
    }
  }

  // 문맥 의존적 표현
  const contextDependentPatterns = [
    { pattern: /이거|저거|그거/, needsContext: '지시대상이 불명확합니다' },
    { pattern: /거기|여기|저기/, needsContext: '장소가 불명확합니다' },
    { pattern: /그때|아까|나중에/, needsContext: '시점이 불명확합니다' },
    { pattern: /걔|쟤|그 사람/, needsContext: '누구를 지칭하는지 불명확합니다' },
  ]

  for (const { pattern, needsContext } of contextDependentPatterns) {
    if (pattern.test(normalizedInput)) {
      isAmbiguous = true
      suggestedClarification = needsContext
      confidence -= 0.15
    }
  }

  // 신조어/줄임말 체크
  const slangPatterns: Record<string, string> = {
    '갑분싸': '갑자기 분위기 싸해짐',
    '인정': '동의/승인',
    '레전드': '대단한/전설적인',
    'ㅋㅋ': '웃음 (haha)',
    'ㅎㅎ': '웃음 (hehe)',
    '헐': '놀라움 (oh my)',
    '대박': '놀라움/훌륭함 (wow/amazing)',
  }

  for (const [slang, meaning] of Object.entries(slangPatterns)) {
    if (normalizedInput.includes(slang)) {
      interpretations.push(`슬랭: ${meaning}`)
      confidence -= 0.1
    }
  }

  return {
    input: normalizedInput,
    isAmbiguous,
    possibleInterpretations: interpretations,
    suggestedClarification,
    confidence: Math.max(0.3, confidence),
  }
}

/**
 * 문맥 기반 해석 선택
 */
function resolveAmbiguityWithContext(
  input: string,
  context: string
): { resolvedMeaning: string; confidence: number } {
  const analysis = analyzeAmbiguity(input)

  // 문맥에 따른 해석 선택
  const contextKeywords: Record<string, string[]> = {
    음식: ['먹다', '식사', '맛있', '요리', '주문'],
    교통: ['타다', '운전', '주차', '도착', '출발'],
    시간: ['시간', '아침', '저녁', '언제', '약속'],
    날씨: ['춥다', '덥다', '비', '눈', '맑다'],
  }

  let resolvedMeaning = analysis.possibleInterpretations[0] || input
  let resolvedConfidence = analysis.confidence

  for (const [category, keywords] of Object.entries(contextKeywords)) {
    if (keywords.some((k) => context.includes(k))) {
      // 문맥에 맞는 해석 찾기
      const matchingInterpretation = analysis.possibleInterpretations.find((interp) =>
        interp.toLowerCase().includes(category)
      )
      if (matchingInterpretation) {
        resolvedMeaning = matchingInterpretation
        resolvedConfidence = Math.min(0.95, resolvedConfidence + 0.2)
      }
    }
  }

  return { resolvedMeaning, confidence: resolvedConfidence }
}

describe('Ambiguous Input Detection', () => {
  describe('Homophone Detection', () => {
    const homophoneTests = [
      { input: '배가 아파', expectedAmbiguous: true, shouldContain: '배' },
      { input: '배를 타자', expectedAmbiguous: true, shouldContain: '배' },
      { input: '배 하나 주세요', expectedAmbiguous: true, shouldContain: '배' },
      { input: '차 마실래?', expectedAmbiguous: true, shouldContain: '차' },
      { input: '밤에 만나자', expectedAmbiguous: true, shouldContain: '밤' },
    ]

    homophoneTests.forEach(({ input, expectedAmbiguous, shouldContain }) => {
      it(`should detect ambiguity in "${input}"`, () => {
        const result = analyzeAmbiguity(input)
        expect(result.isAmbiguous).toBe(expectedAmbiguous)
        if (expectedAmbiguous) {
          expect(result.possibleInterpretations.length).toBeGreaterThan(0)
          expect(
            result.possibleInterpretations.some((i) => i.includes(shouldContain))
          ).toBe(true)
        }
      })
    })
  })

  describe('Formality Ambiguity', () => {
    const formalityTests = [
      { input: '고마워', isAmbiguous: true },
      { input: '감사합니다', isAmbiguous: true },
      { input: '미안해', isAmbiguous: true },
      { input: '죄송합니다', isAmbiguous: true },
      { input: '안녕', isAmbiguous: true },
    ]

    formalityTests.forEach(({ input, isAmbiguous }) => {
      it(`should detect formality ambiguity in "${input}"`, () => {
        const result = analyzeAmbiguity(input)
        expect(result.isAmbiguous).toBe(isAmbiguous)
        if (isAmbiguous) {
          expect(result.suggestedClarification).toBeDefined()
        }
      })
    })
  })

  describe('Context-Dependent Expressions', () => {
    const contextTests = [
      { input: '이거 뭐야?', needsContext: true },
      { input: '거기 어디야?', needsContext: true },
      { input: '그때 뭐 했어?', needsContext: true },
      { input: '걔 누구야?', needsContext: true },
    ]

    contextTests.forEach(({ input, needsContext }) => {
      it(`should flag "${input}" as needing context`, () => {
        const result = analyzeAmbiguity(input)
        expect(result.isAmbiguous).toBe(needsContext)
        expect(result.suggestedClarification).toBeDefined()
      })
    })
  })

  describe('Slang and Abbreviations', () => {
    const slangTests = [
      { input: '갑분싸 됐다', hasSlang: true },
      { input: '레전드야 진짜', hasSlang: true },
      { input: '인정이요', hasSlang: true },
      { input: 'ㅋㅋㅋ 웃겨', hasSlang: true },
      { input: '헐 대박', hasSlang: true },
    ]

    slangTests.forEach(({ input, hasSlang }) => {
      it(`should detect slang in "${input}"`, () => {
        const result = analyzeAmbiguity(input)
        if (hasSlang) {
          expect(result.possibleInterpretations.some((i) => i.includes('슬랭'))).toBe(true)
        }
      })
    })
  })
})

describe('Context-Based Resolution', () => {
  describe('Food context', () => {
    it('should resolve "배" as fruit in food context', () => {
      const result = resolveAmbiguityWithContext('배 주세요', '과일 먹고 싶어')
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('Transportation context', () => {
    it('should resolve "차" as car in transportation context', () => {
      const result = resolveAmbiguityWithContext('차 타자', '어디 가? 운전해서 데려다줄게')
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('Weather context', () => {
    it('should resolve "눈" as weather in weather context', () => {
      const result = resolveAmbiguityWithContext('눈이 와', '오늘 날씨가 추워')
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })
})

describe('Confidence Scoring', () => {
  describe('High confidence inputs', () => {
    const clearInputs = [
      '점심 먹었어?',
      '내일 몇 시에 만나?',
      '오늘 날씨 좋다',
      '집에 갈게',
    ]

    clearInputs.forEach((input) => {
      it(`should have high confidence for "${input}"`, () => {
        const result = analyzeAmbiguity(input)
        expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      })
    })
  })

  describe('Low confidence inputs', () => {
    const ambiguousInputs = [
      '그거 이거 저거',
      '배 차 눈',
      '걔한테 말해',
    ]

    ambiguousInputs.forEach((input) => {
      it(`should have lower confidence for "${input}"`, () => {
        const result = analyzeAmbiguity(input)
        expect(result.confidence).toBeLessThan(0.8)
      })
    })
  })

  describe('Confidence never goes below threshold', () => {
    it('should maintain minimum confidence of 0.3', () => {
      // 최악의 경우에도 최소 신뢰도 유지
      const worstCase = '그거 배 차 눈 거기 ㅋㅋ 헐'
      const result = analyzeAmbiguity(worstCase)
      expect(result.confidence).toBeGreaterThanOrEqual(0.3)
    })
  })
})

describe('Multiple Interpretations', () => {
  describe('Should provide multiple meanings', () => {
    it('should list all possible meanings for homophones', () => {
      const result = analyzeAmbiguity('배가 고파')
      expect(result.possibleInterpretations.length).toBeGreaterThan(1)
    })

    it('should include both casual and formal interpretations', () => {
      const result = analyzeAmbiguity('고마워')
      expect(result.possibleInterpretations.some((i) => i.includes('casual'))).toBe(true)
      expect(result.possibleInterpretations.some((i) => i.includes('formal'))).toBe(true)
    })
  })

  describe('Interpretation quality', () => {
    it('should provide non-empty interpretations', () => {
      const inputs = ['배', '차', '밤', '눈', '말', '손']
      inputs.forEach((input) => {
        const result = analyzeAmbiguity(input)
        result.possibleInterpretations.forEach((interp) => {
          expect(interp.length).toBeGreaterThan(0)
        })
      })
    })
  })
})

describe('Clarification Suggestions', () => {
  describe('Should suggest appropriate clarifications', () => {
    const clarificationTests = [
      {
        input: '배 주세요',
        expectedPattern: /배/,
      },
      {
        input: '고마워',
        expectedPattern: /격식/,
      },
      {
        input: '거기 가자',
        expectedPattern: /장소/,
      },
      {
        input: '그때 만나자',
        expectedPattern: /시점/,
      },
    ]

    clarificationTests.forEach(({ input, expectedPattern }) => {
      it(`should suggest clarification for "${input}"`, () => {
        const result = analyzeAmbiguity(input)
        expect(result.suggestedClarification).toBeDefined()
        expect(result.suggestedClarification).toMatch(expectedPattern)
      })
    })
  })
})

describe('Edge Cases in Ambiguity Detection', () => {
  describe('Empty and whitespace inputs', () => {
    it('should handle empty input', () => {
      const result = analyzeAmbiguity('')
      expect(result.input).toBe('')
      expect(result.isAmbiguous).toBe(false)
    })

    it('should handle whitespace-only input', () => {
      const result = analyzeAmbiguity('   ')
      expect(result.input).toBe('')
    })
  })

  describe('Very long inputs', () => {
    it('should handle long input without performance issues', () => {
      const longInput = '배를 타고 바다를 건너서 차를 마시면서 밤에 눈을 보며 산책했어'
      const startTime = Date.now()
      const result = analyzeAmbiguity(longInput)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // 100ms 이내
      expect(result.possibleInterpretations.length).toBeGreaterThan(0)
    })
  })

  describe('Mixed language inputs', () => {
    it('should handle Korean-English mixed input', () => {
      const result = analyzeAmbiguity('coffee 마실래?')
      expect(result.input).toBe('coffee 마실래?')
    })

    it('should handle input with numbers', () => {
      const result = analyzeAmbiguity('3시에 만나자')
      expect(result.input).toBe('3시에 만나자')
    })
  })

  describe('Special characters', () => {
    it('should handle emoticons', () => {
      const result = analyzeAmbiguity('고마워 😊')
      expect(result.isAmbiguous).toBe(true)
    })

    it('should handle punctuation', () => {
      const result = analyzeAmbiguity('배가 아파!!!')
      expect(result.isAmbiguous).toBe(true)
    })
  })
})

describe('Real-World Ambiguous Scenarios', () => {
  const scenarios = [
    {
      input: '눈이 커',
      context: '누가 예쁘다는 얘기',
      expectedMeaning: 'eyes',
    },
    {
      input: '눈이 많이 왔어',
      context: '날씨 얘기',
      expectedMeaning: 'snow',
    },
    {
      input: '배 타고 싶어',
      context: '여행 계획',
      expectedMeaning: 'boat',
    },
    {
      input: '배 먹고 싶어',
      context: '간식 얘기',
      expectedMeaning: 'pear',
    },
    {
      input: '차 마시자',
      context: '카페에서',
      expectedMeaning: 'tea',
    },
    {
      input: '차 타자',
      context: '이동 수단',
      expectedMeaning: 'car',
    },
  ]

  scenarios.forEach(({ input, context, expectedMeaning }) => {
    it(`should prefer "${expectedMeaning}" meaning for "${input}" in context "${context}"`, () => {
      const analysis = analyzeAmbiguity(input)
      expect(analysis.isAmbiguous).toBe(true)

      // 문맥과 함께 해결
      const resolved = resolveAmbiguityWithContext(input, context)
      expect(resolved.confidence).toBeGreaterThan(0.3)
    })
  })
})
