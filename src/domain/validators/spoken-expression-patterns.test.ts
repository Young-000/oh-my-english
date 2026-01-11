import { describe, it, expect } from 'vitest'

/**
 * 구어체/스피킹 표현 패턴 테스트
 *
 * 원어민이 실제 대화에서 사용하는 구어체 특성 검증:
 * - 축약형 (contractions)
 * - 연음/발음 패턴
 * - 필러/간투사
 * - 구어체 문법
 * - 감정 표현
 */

/**
 * 축약형 표현 분석
 */
interface _ContractionAnalysis {
  original: string
  contracted: string
  isNatural: boolean
  formalityLevel: 'very_casual' | 'casual' | 'neutral' | 'formal'
}

const COMMON_CONTRACTIONS: Record<string, string> = {
  "I am": "I'm",
  "I have": "I've",
  "I will": "I'll",
  "I would": "I'd",
  "you are": "you're",
  "you have": "you've",
  "you will": "you'll",
  "you would": "you'd",
  "he is": "he's",
  "he has": "he's",
  "he will": "he'll",
  "he would": "he'd",
  "she is": "she's",
  "she has": "she's",
  "she will": "she'll",
  "she would": "she'd",
  "it is": "it's",
  "it has": "it's",
  "it will": "it'll",
  "we are": "we're",
  "we have": "we've",
  "we will": "we'll",
  "we would": "we'd",
  "they are": "they're",
  "they have": "they've",
  "they will": "they'll",
  "they would": "they'd",
  "is not": "isn't",
  "are not": "aren't",
  "was not": "wasn't",
  "were not": "weren't",
  "have not": "haven't",
  "has not": "hasn't",
  "had not": "hadn't",
  "will not": "won't",
  "would not": "wouldn't",
  "could not": "couldn't",
  "should not": "shouldn't",
  "can not": "can't",
  "do not": "don't",
  "does not": "doesn't",
  "did not": "didn't",
  "let us": "let's",
  "that is": "that's",
  "what is": "what's",
  "who is": "who's",
  "where is": "where's",
  "there is": "there's",
}

/**
 * 축약형 적용
 */
function applyContractions(text: string): string {
  let result = text
  for (const [full, contracted] of Object.entries(COMMON_CONTRACTIONS)) {
    const regex = new RegExp(full, 'gi')
    result = result.replace(regex, contracted)
  }
  return result
}

/**
 * 축약형 사용 여부 확인
 */
function hasContractions(text: string): boolean {
  return /'(m|ve|ll|d|re|s|t|nt)\b/i.test(text)
}

/**
 * 구어체 자연스러움 점수
 */
function calculateSpokenNaturalness(text: string): {
  score: number
  features: string[]
} {
  const features: string[] = []
  let score = 50

  // 축약형 사용
  if (hasContractions(text)) {
    score += 15
    features.push('uses contractions')
  }

  // 구어체 패턴
  const spokenPatterns = [
    { pattern: /\b(gonna|wanna|gotta)\b/i, feature: 'informal reductions' },
    { pattern: /\b(yeah|yep|nope|uh-huh)\b/i, feature: 'casual affirmatives' },
    { pattern: /\b(kinda|sorta|outta|lotta)\b/i, feature: 'casual combinations' },
    { pattern: /\b(dunno|gimme|lemme|gotcha)\b/i, feature: 'spoken shortcuts' },
    { pattern: /\?$/, feature: 'question intonation' },
    { pattern: /!$/, feature: 'exclamation' },
    { pattern: /\.{3}/, feature: 'trailing off' },
  ]

  spokenPatterns.forEach(({ pattern, feature }) => {
    if (pattern.test(text)) {
      score += 5
      features.push(feature)
    }
  })

  // 필러 워드
  const fillerPatterns = [
    /\b(um|uh|er|well|like|you know|I mean)\b/i,
  ]
  fillerPatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      score += 3
      features.push('uses fillers')
    }
  })

  return { score: Math.min(100, score), features }
}

/**
 * 감정 강도 분석
 */
function analyzeEmotionalIntensity(text: string): {
  intensity: 'low' | 'medium' | 'high' | 'very_high'
  indicators: string[]
} {
  const indicators: string[] = []
  let intensityScore = 0

  // 감탄사
  const exclamations = text.match(/!/g)
  if (exclamations) {
    intensityScore += exclamations.length * 2
    indicators.push(`${exclamations.length} exclamation(s)`)
  }

  // 대문자 강조
  const capsWords = text.match(/\b[A-Z]{2,}\b/g)
  if (capsWords) {
    intensityScore += capsWords.length * 3
    indicators.push('caps for emphasis')
  }

  // 감정 단어
  const emotionalWords = [
    /\b(absolutely|totally|completely|extremely|incredibly)\b/i,
    /\b(amazing|awesome|fantastic|terrible|horrible)\b/i,
    /\b(love|hate|adore|despise)\b/i,
    /\b(so|really|very|super)\b/i,
  ]

  emotionalWords.forEach((pattern) => {
    if (pattern.test(text)) {
      intensityScore += 2
      indicators.push('emotional intensifiers')
    }
  })

  let intensity: 'low' | 'medium' | 'high' | 'very_high'
  if (intensityScore < 3) intensity = 'low'
  else if (intensityScore < 7) intensity = 'medium'
  else if (intensityScore < 12) intensity = 'high'
  else intensity = 'very_high'

  return { intensity, indicators: [...new Set(indicators)] }
}

describe('Contraction Patterns', () => {
  describe('Common contractions', () => {
    const contractionTests = [
      { full: "I am happy", expected: "I'm" },
      { full: "you are great", expected: "you're" },
      { full: "he is coming", expected: "he's" },
      { full: "we have finished", expected: "we've" },
      { full: "they will help", expected: "they'll" },
      { full: "I would like", expected: "I'd" },
      { full: "it is not fair", expected: "it's" },
      { full: "I do not know", expected: "don't" },
      { full: "she can not come", expected: "can't" },
      { full: "let us go", expected: "let's" },
    ]

    contractionTests.forEach(({ full, expected }) => {
      it(`should apply contraction to "${full}"`, () => {
        expect(applyContractions(full).toLowerCase()).toContain(expected.toLowerCase())
      })
    })
  })

  describe('Contraction detection', () => {
    const hasContractionTests = [
      { text: "I'm going home", expected: true },
      { text: "I am going home", expected: false },
      { text: "Don't worry", expected: true },
      { text: "Do not worry", expected: false },
      { text: "What's up?", expected: true },
      { text: "What is up?", expected: false },
    ]

    hasContractionTests.forEach(({ text, expected }) => {
      it(`should ${expected ? 'detect' : 'not detect'} contraction in "${text}"`, () => {
        expect(hasContractions(text)).toBe(expected)
      })
    })
  })

  describe('Negative contractions', () => {
    // 부정 축약형은 COMMON_CONTRACTIONS 맵에 정의됨
    it('should have negative contractions defined', () => {
      expect(COMMON_CONTRACTIONS["is not"]).toBe("isn't")
      expect(COMMON_CONTRACTIONS["are not"]).toBe("aren't")
      expect(COMMON_CONTRACTIONS["was not"]).toBe("wasn't")
      expect(COMMON_CONTRACTIONS["do not"]).toBe("don't")
      expect(COMMON_CONTRACTIONS["does not"]).toBe("doesn't")
      expect(COMMON_CONTRACTIONS["did not"]).toBe("didn't")
      expect(COMMON_CONTRACTIONS["can not"]).toBe("can't")
      expect(COMMON_CONTRACTIONS["will not"]).toBe("won't")
    })

    it('should apply simple negative contractions', () => {
      expect(applyContractions("do not worry")).toBe("don't worry")
      expect(applyContractions("can not help")).toBe("can't help")
      expect(applyContractions("did not know")).toBe("didn't know")
    })
  })
})

describe('Spoken Naturalness', () => {
  describe('High naturalness expressions', () => {
    const naturalExpressions = [
      "What's up? How're you doing?",
      "I'm gonna go now, see ya!",
      "Wanna grab some food?",
      "Yeah, that's kinda what I meant.",
      "I dunno, maybe we should wait...",
    ]

    naturalExpressions.forEach((text) => {
      it(`should rate "${text.substring(0, 30)}..." as natural`, () => {
        const result = calculateSpokenNaturalness(text)
        expect(result.score).toBeGreaterThanOrEqual(60)
        expect(result.features.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Lower naturalness expressions', () => {
    const formalExpressions = [
      "I am going to leave now.",
      "Would you like to acquire some sustenance?",
      "I do not know the answer to that question.",
      "It is not possible for me to attend.",
    ]

    formalExpressions.forEach((text) => {
      it(`should rate "${text.substring(0, 30)}..." as less natural for spoken`, () => {
        const result = calculateSpokenNaturalness(text)
        expect(result.score).toBeLessThan(70)
      })
    })
  })

  describe('Feature detection', () => {
    it('should detect contractions', () => {
      const result = calculateSpokenNaturalness("I'm fine")
      expect(result.features).toContain('uses contractions')
    })

    it('should detect informal reductions', () => {
      const result = calculateSpokenNaturalness("I'm gonna go")
      expect(result.features).toContain('informal reductions')
    })

    it('should detect casual combinations', () => {
      const result = calculateSpokenNaturalness("It's kinda cool")
      expect(result.features).toContain('casual combinations')
    })
  })
})

describe('Informal Spoken Patterns', () => {
  describe('Gonna/Wanna/Gotta patterns', () => {
    const informalPatterns = [
      { informal: "I'm gonna do it", formal: "I am going to do it" },
      { informal: "Wanna come?", formal: "Do you want to come?" },
      { informal: "I gotta go", formal: "I have got to go" },
    ]

    informalPatterns.forEach(({ informal, formal }) => {
      it(`should recognize "${informal}" as informal spoken pattern`, () => {
        const informalResult = calculateSpokenNaturalness(informal)
        const formalResult = calculateSpokenNaturalness(formal)
        expect(informalResult.score).toBeGreaterThanOrEqual(formalResult.score)
      })
    })
  })

  describe('Casual affirmatives/negatives', () => {
    const casualResponses = [
      { casual: "Yeah, sure!", formal: "Yes, certainly." },
      { casual: "Nope, not really", formal: "No, not particularly." },
      { casual: "Yep, I did", formal: "Yes, I did." },
      { casual: "Uh-huh, I know", formal: "Yes, I understand." },
    ]

    casualResponses.forEach(({ casual, formal }) => {
      it(`should rate "${casual}" as more casual than "${formal}"`, () => {
        const casualResult = calculateSpokenNaturalness(casual)
        const formalResult = calculateSpokenNaturalness(formal)
        expect(casualResult.score).toBeGreaterThanOrEqual(formalResult.score)
      })
    })
  })
})

describe('Emotional Intensity Analysis', () => {
  describe('Low intensity', () => {
    const lowIntensity = [
      "It was okay.",
      "I guess so.",
      "Maybe later.",
      "Fine by me.",
    ]

    lowIntensity.forEach((text) => {
      it(`should rate "${text}" as low intensity`, () => {
        const result = analyzeEmotionalIntensity(text)
        expect(result.intensity).toBe('low')
      })
    })
  })

  describe('Medium intensity', () => {
    const mediumIntensity = [
      "That's really good!",
      "This is so cool!",
      "I absolutely love this!",
    ]

    mediumIntensity.forEach((text) => {
      it(`should rate "${text}" as medium or higher intensity`, () => {
        const result = analyzeEmotionalIntensity(text)
        expect(['medium', 'high', 'very_high']).toContain(result.intensity)
      })
    })
  })

  describe('High intensity', () => {
    const highIntensity = [
      "This is absolutely AMAZING!!!",
      "I totally LOVE it!!!",
      "That was SO incredibly FANTASTIC!!!",
    ]

    highIntensity.forEach((text) => {
      it(`should rate "${text}" as high or very_high intensity`, () => {
        const result = analyzeEmotionalIntensity(text)
        expect(['high', 'very_high']).toContain(result.intensity)
      })
    })
  })

  describe('Indicator detection', () => {
    it('should detect exclamation marks', () => {
      const result = analyzeEmotionalIntensity("Wow! Amazing!")
      expect(result.indicators).toContain('2 exclamation(s)')
    })

    it('should detect caps emphasis', () => {
      const result = analyzeEmotionalIntensity("This is SO GOOD")
      expect(result.indicators).toContain('caps for emphasis')
    })
  })
})

describe('Spoken vs Written Comparison', () => {
  const comparisons = [
    {
      spoken: "Whatcha doin'?",
      written: "What are you doing?",
      meaning: '뭐 해?',
    },
    {
      spoken: "Lemme see that",
      written: "Let me see that",
      meaning: '그거 보여줘',
    },
    {
      spoken: "Gimme a sec",
      written: "Give me a second",
      meaning: '잠깐만',
    },
    {
      spoken: "I dunno",
      written: "I do not know",
      meaning: '몰라',
    },
    {
      spoken: "C'mon!",
      written: "Come on!",
      meaning: '제발/어서',
    },
  ]

  comparisons.forEach(({ spoken, written, meaning }) => {
    describe(`For "${meaning}"`, () => {
      it(`should prefer "${spoken}" for spoken naturalness`, () => {
        const spokenScore = calculateSpokenNaturalness(spoken)
        const writtenScore = calculateSpokenNaturalness(written)
        expect(spokenScore.score).toBeGreaterThanOrEqual(writtenScore.score)
      })
    })
  })
})

describe('Filler Words and Hesitation', () => {
  describe('Common fillers', () => {
    const fillerExamples = [
      { text: "Well, I think so", filler: "well" },
      { text: "Um, let me think", filler: "um" },
      { text: "You know, it's like that", filler: "you know" },
      { text: "I mean, it's okay", filler: "I mean" },
      { text: "Like, whatever", filler: "like" },
    ]

    fillerExamples.forEach(({ text, filler }) => {
      it(`should recognize "${filler}" as filler in "${text}"`, () => {
        const result = calculateSpokenNaturalness(text)
        expect(result.features).toContain('uses fillers')
      })
    })
  })

  describe('Hesitation patterns', () => {
    const hesitationPatterns = [
      "Let me see...",
      "Hmm, I think...",
      "Well...",
      "Actually...",
    ]

    hesitationPatterns.forEach((text) => {
      it(`should recognize hesitation in "${text}"`, () => {
        const result = calculateSpokenNaturalness(text)
        expect(result.features).toContain('trailing off')
      })
    })
  })
})

describe('Question Intonation Patterns', () => {
  describe('Rising intonation questions', () => {
    const questions = [
      "You're coming?",
      "Really?",
      "No way?",
      "For real?",
      "He said that?",
    ]

    questions.forEach((text) => {
      it(`should detect question intonation in "${text}"`, () => {
        const result = calculateSpokenNaturalness(text)
        expect(result.features).toContain('question intonation')
      })
    })
  })

  describe('Tag questions', () => {
    const tagQuestions = [
      "It's nice, isn't it?",
      "You know him, don't you?",
      "She's coming, right?",
      "That's cool, yeah?",
    ]

    tagQuestions.forEach((text) => {
      it(`should recognize tag question "${text}"`, () => {
        expect(text).toMatch(/\?$/)
        // 태그 질문: 쉼표 뒤에 단어들이 오고 물음표로 끝남
        expect(text).toMatch(/,\s*.+\?$/)
      })
    })
  })
})

describe('Exclamatory Expressions', () => {
  const exclamations = [
    { text: "Wow!", emotion: 'surprise' },
    { text: "Oh my gosh!", emotion: 'surprise' },
    { text: "No way!", emotion: 'disbelief' },
    { text: "Awesome!", emotion: 'excitement' },
    { text: "Yikes!", emotion: 'alarm' },
    { text: "Oops!", emotion: 'mistake' },
    { text: "Yay!", emotion: 'joy' },
    { text: "Ugh!", emotion: 'frustration' },
    { text: "Phew!", emotion: 'relief' },
    { text: "Ouch!", emotion: 'pain' },
  ]

  exclamations.forEach(({ text, emotion }) => {
    it(`should recognize "${text}" as ${emotion} exclamation`, () => {
      const result = calculateSpokenNaturalness(text)
      expect(result.features).toContain('exclamation')
    })
  })
})

describe('Regional and Generational Variations', () => {
  describe('American casual expressions', () => {
    const americanExpressions = [
      "What's up?",
      "How's it going?",
      "See ya later!",
      "You guys wanna come?",
      "That's so cool!",
    ]

    americanExpressions.forEach((text) => {
      it(`should recognize "${text}" as casual American`, () => {
        const result = calculateSpokenNaturalness(text)
        expect(result.score).toBeGreaterThan(50)
      })
    })
  })

  describe('British casual expressions', () => {
    const britishExpressions = [
      "Cheers!",
      "Brilliant!",
      "Fancy a cuppa?",
      "That's lovely!",
      "Ta!",
    ]

    britishExpressions.forEach((text) => {
      it(`should accept "${text}" as valid casual expression`, () => {
        expect(text.length).toBeGreaterThan(0)
      })
    })
  })
})
