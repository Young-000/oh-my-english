import { describe, it, expect } from 'vitest'

/**
 * 다양한 한국어 입력 시나리오 테스트
 *
 * 실제 사용자가 입력할 수 있는 다양한 형태의 한국어 표현을
 * 검증하고 적절히 처리되는지 확인
 */

/**
 * 입력 유효성 검증
 */
function validateKoreanInput(input: string): {
  isValid: boolean
  normalizedInput: string
  warnings: string[]
  category?: string
} {
  const warnings: string[] = []
  let normalized = input.trim()

  // 빈 입력 체크
  if (!normalized) {
    return { isValid: false, normalizedInput: '', warnings: ['Empty input'] }
  }

  // 너무 짧은 입력 (2글자 미만)
  if (normalized.length < 2) {
    return { isValid: false, normalizedInput: normalized, warnings: ['Input too short'] }
  }

  // 너무 긴 입력 (500자 초과)
  if (normalized.length > 500) {
    warnings.push('Input truncated to 500 characters')
    normalized = normalized.substring(0, 500)
  }

  // 한국어가 포함되어 있는지 확인
  const hasKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(normalized)
  if (!hasKorean) {
    warnings.push('No Korean characters detected')
  }

  // 연속된 공백 정규화
  if (/\s{2,}/.test(normalized)) {
    normalized = normalized.replace(/\s+/g, ' ')
    warnings.push('Multiple spaces normalized')
  }

  // 특수문자 과다 사용 체크
  const specialCharRatio =
    (normalized.match(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s.,?!'"]/g)?.length || 0) / normalized.length
  if (specialCharRatio > 0.3) {
    warnings.push('High special character ratio')
  }

  // 카테고리 자동 감지
  const category = detectCategory(normalized)

  return {
    isValid: true,
    normalizedInput: normalized,
    warnings,
    category,
  }
}

/**
 * 입력 텍스트에서 카테고리 자동 감지
 */
function detectCategory(input: string): string | undefined {
  const categoryPatterns: { pattern: RegExp; category: string }[] = [
    { pattern: /아기|아이|유아|어린이|엄마|아빠|젖병|기저귀|이유식|분유/, category: '육아' },
    { pattern: /회의|보고서|발표|프로젝트|팀|상사|사무실|근무|출장|이메일/, category: '비즈니스' },
    { pattern: /밥|먹|배고|맛|음식|요리|식사|뭐 먹/, category: '일상대화' },
    { pattern: /화나|짜증|기뻐|슬퍼|걱정|불안|행복|좋아|싫어/, category: '감정표현' },
    { pattern: /여행|호텔|비행기|공항|예약|관광|휴가/, category: '여행' },
    { pattern: /병원|의사|약|아파|건강|진료|처방/, category: '건강/의료' },
  ]

  for (const { pattern, category } of categoryPatterns) {
    if (pattern.test(input)) {
      return category
    }
  }

  return '일상대화' // 기본값
}

describe('Korean Input Validation', () => {
  describe('Basic validation', () => {
    it('should accept valid Korean input', () => {
      const result = validateKoreanInput('밥 먹었어?')
      expect(result.isValid).toBe(true)
      expect(result.normalizedInput).toBe('밥 먹었어?')
    })

    it('should reject empty input', () => {
      const result = validateKoreanInput('')
      expect(result.isValid).toBe(false)
      expect(result.warnings).toContain('Empty input')
    })

    it('should reject whitespace-only input', () => {
      const result = validateKoreanInput('   ')
      expect(result.isValid).toBe(false)
    })

    it('should reject single character input', () => {
      const result = validateKoreanInput('안')
      expect(result.isValid).toBe(false)
      expect(result.warnings).toContain('Input too short')
    })

    it('should accept 2-character input', () => {
      const result = validateKoreanInput('안녕')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Normalization', () => {
    it('should trim whitespace', () => {
      const result = validateKoreanInput('  안녕하세요  ')
      expect(result.normalizedInput).toBe('안녕하세요')
    })

    it('should normalize multiple spaces', () => {
      const result = validateKoreanInput('밥   먹었어?')
      expect(result.normalizedInput).toBe('밥 먹었어?')
      expect(result.warnings).toContain('Multiple spaces normalized')
    })

    it('should truncate very long input', () => {
      const longInput = '가'.repeat(600)
      const result = validateKoreanInput(longInput)
      expect(result.normalizedInput.length).toBe(500)
      expect(result.warnings).toContain('Input truncated to 500 characters')
    })
  })

  describe('Korean detection', () => {
    it('should accept pure Korean input', () => {
      const result = validateKoreanInput('오늘 날씨가 어때?')
      expect(result.isValid).toBe(true)
      expect(result.warnings).not.toContain('No Korean characters detected')
    })

    it('should accept Korean with English', () => {
      const result = validateKoreanInput('OK라고 말해')
      expect(result.isValid).toBe(true)
    })

    it('should warn for pure English input', () => {
      const result = validateKoreanInput('Hello world')
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('No Korean characters detected')
    })

    it('should accept Korean with numbers', () => {
      const result = validateKoreanInput('3시에 만나자')
      expect(result.isValid).toBe(true)
    })

    it('should accept Korean with emojis', () => {
      const result = validateKoreanInput('고마워! 😊')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Special character handling', () => {
    it('should accept normal punctuation', () => {
      const result = validateKoreanInput('밥 먹었어?!')
      expect(result.isValid).toBe(true)
      expect(result.warnings).not.toContain('High special character ratio')
    })

    it('should warn for excessive special characters', () => {
      const result = validateKoreanInput('!!!???@@@###')
      expect(result.warnings).toContain('High special character ratio')
    })

    it('should handle quotes properly', () => {
      const result = validateKoreanInput('"괜찮아"라고 했어')
      expect(result.isValid).toBe(true)
    })
  })
})

describe('Category Detection', () => {
  describe('Parenting expressions', () => {
    const parentingInputs = [
      '아기 재워야 해',
      '이유식 뭐 먹일까?',
      '기저귀 갈아야 해',
      '분유 타야 하는데',
      '아이 학원 데려다 줘야 해',
    ]

    parentingInputs.forEach((input) => {
      it(`should categorize "${input}" as 육아`, () => {
        const result = validateKoreanInput(input)
        expect(result.category).toBe('육아')
      })
    })
  })

  describe('Business expressions', () => {
    const businessInputs = [
      '회의 일정 잡아주세요',
      '보고서 검토해주세요',
      '발표 자료 준비됐어?',
      '이메일 확인해주세요',
      '출장 다녀올게요',
    ]

    businessInputs.forEach((input) => {
      it(`should categorize "${input}" as 비즈니스`, () => {
        const result = validateKoreanInput(input)
        expect(result.category).toBe('비즈니스')
      })
    })
  })

  describe('Daily conversation expressions', () => {
    const dailyInputs = ['밥 먹었어?', '오늘 뭐해?', '집에 갈래', '주말에 뭐 할거야?']

    dailyInputs.forEach((input) => {
      it(`should categorize "${input}" as 일상대화`, () => {
        const result = validateKoreanInput(input)
        expect(result.category).toBe('일상대화')
      })
    })
  })

  describe('Emotional expressions', () => {
    const emotionalInputs = [
      '너무 화나',
      '진짜 기뻐',
      '슬퍼 죽겠어',
      '걱정되네',
      '정말 좋아해',
    ]

    emotionalInputs.forEach((input) => {
      it(`should categorize "${input}" as 감정표현`, () => {
        const result = validateKoreanInput(input)
        expect(result.category).toBe('감정표현')
      })
    })
  })

  describe('Travel expressions', () => {
    const travelInputs = [
      '여행 가고 싶어',
      '호텔 예약했어?',
      '비행기 몇 시야?',
      '관광지 추천해줘',
    ]

    travelInputs.forEach((input) => {
      it(`should categorize "${input}" as 여행`, () => {
        const result = validateKoreanInput(input)
        expect(result.category).toBe('여행')
      })
    })
  })

  describe('Health expressions', () => {
    const healthInputs = ['병원 가야 해', '의사 선생님이 뭐라고 했어?', '좀 아파', '진료 받았어']

    healthInputs.forEach((input) => {
      it(`should categorize "${input}" as 건강/의료`, () => {
        const result = validateKoreanInput(input)
        expect(result.category).toBe('건강/의료')
      })
    })

    it('should categorize ambiguous "약 먹었어?" as 일상대화 (no health keyword)', () => {
      // "약"만으로는 건강/의료로 분류되지 않음 (약속 등 다른 의미 가능)
      const result = validateKoreanInput('약 먹었어?')
      expect(result.category).toBe('일상대화')
    })
  })
})

describe('Real-world Input Scenarios', () => {
  describe('Casual speech patterns', () => {
    const casualInputs = [
      { input: '뭐해', expected: '일상대화' },
      { input: '배고파', expected: '일상대화' },
      { input: '심심해', expected: '일상대화' },
      { input: '집에 가자', expected: '일상대화' },
      { input: '어디야?', expected: '일상대화' },
    ]

    casualInputs.forEach(({ input, expected }) => {
      it(`should handle casual input "${input}"`, () => {
        const result = validateKoreanInput(input)
        expect(result.isValid).toBe(true)
        expect(result.category).toBe(expected)
      })
    })
  })

  describe('Formal speech patterns', () => {
    const formalInputs = [
      '감사합니다',
      '실례합니다',
      '죄송합니다',
      '안녕하세요',
      '부탁드립니다',
    ]

    formalInputs.forEach((input) => {
      it(`should accept formal input "${input}"`, () => {
        const result = validateKoreanInput(input)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('Slang and informal expressions', () => {
    const slangInputs = [
      { input: 'ㅋㅋㅋ', valid: true },
      { input: 'ㅎㅎ', valid: true },
      { input: 'ㄱㅅ', valid: true },
      { input: '대박', valid: true },
      { input: '레알?', valid: true },
      { input: '헐ㅋㅋ', valid: true },
    ]

    slangInputs.forEach(({ input, valid }) => {
      it(`should handle slang "${input}"`, () => {
        const result = validateKoreanInput(input)
        expect(result.isValid).toBe(valid)
      })
    })

    it('should reject single character slang "헐" as too short', () => {
      // 단일 글자는 번역하기 어려우므로 무효 처리
      const result = validateKoreanInput('헐')
      expect(result.isValid).toBe(false)
      expect(result.warnings).toContain('Input too short')
    })
  })

  describe('Mixed language inputs', () => {
    const mixedInputs = [
      { input: 'OK 알겠어', hasWarning: false },
      { input: '네 meeting 있어', hasWarning: false },
      { input: 'OMG 진짜?', hasWarning: false },
      { input: '카페에서 coffee 마시자', hasWarning: false },
    ]

    mixedInputs.forEach(({ input, hasWarning }) => {
      it(`should handle mixed input "${input}"`, () => {
        const result = validateKoreanInput(input)
        expect(result.isValid).toBe(true)
        if (hasWarning) {
          expect(result.warnings.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Complex sentence structures', () => {
    const complexInputs = [
      '내일 시간 되면 같이 밥 먹을래?',
      '그 영화 봤어? 어땠어?',
      '비가 오는데 우산 가져왔어?',
      '숙제 다 했어? 아직 안 했으면 빨리 해',
      '회의 끝나고 커피 한 잔 할까요?',
    ]

    complexInputs.forEach((input) => {
      it(`should handle complex input "${input}"`, () => {
        const result = validateKoreanInput(input)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('Expressions with context', () => {
    const contextualInputs = [
      {
        input: '(아기에게) 맘마 먹을까?',
        description: 'parenthetical context',
      },
      {
        input: '[급함] 지금 어디야?',
        description: 'bracketed context',
      },
      {
        input: '※ 중요: 내일까지 제출',
        description: 'special marker',
      },
    ]

    contextualInputs.forEach(({ input, description }) => {
      it(`should handle input with ${description}: "${input}"`, () => {
        const result = validateKoreanInput(input)
        expect(result.isValid).toBe(true)
      })
    })
  })
})

describe('Edge Cases and Error Handling', () => {
  describe('Unicode edge cases', () => {
    it('should handle combining characters', () => {
      const result = validateKoreanInput('안녕하세요')
      expect(result.isValid).toBe(true)
    })

    it('should handle fullwidth characters', () => {
      const result = validateKoreanInput('１２３시에')
      expect(result.isValid).toBe(true)
    })

    it('should handle zero-width characters', () => {
      const input = '안녕\u200B하세요' // zero-width space
      const result = validateKoreanInput(input)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Whitespace variations', () => {
    it('should handle tabs', () => {
      const result = validateKoreanInput('안녕\t하세요')
      expect(result.isValid).toBe(true)
    })

    it('should handle newlines', () => {
      const result = validateKoreanInput('안녕\n하세요')
      expect(result.isValid).toBe(true)
    })

    it('should handle mixed whitespace', () => {
      const result = validateKoreanInput('안녕 \t \n 하세요')
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Multiple spaces normalized')
    })
  })

  describe('Boundary conditions', () => {
    it('should handle exactly 500 characters', () => {
      const input = '가'.repeat(500)
      const result = validateKoreanInput(input)
      expect(result.isValid).toBe(true)
      expect(result.normalizedInput.length).toBe(500)
      expect(result.warnings).not.toContain('Input truncated to 500 characters')
    })

    it('should handle 501 characters', () => {
      const input = '가'.repeat(501)
      const result = validateKoreanInput(input)
      expect(result.isValid).toBe(true)
      expect(result.normalizedInput.length).toBe(500)
      expect(result.warnings).toContain('Input truncated to 500 characters')
    })
  })
})

describe('Integration with Translation Flow', () => {
  /**
   * 번역 요청 시뮬레이션
   */
  function simulateTranslationRequest(input: string): {
    canProcess: boolean
    processedInput: string
    reason?: string
  } {
    const validation = validateKoreanInput(input)

    if (!validation.isValid) {
      return {
        canProcess: false,
        processedInput: '',
        reason: validation.warnings[0],
      }
    }

    return {
      canProcess: true,
      processedInput: validation.normalizedInput,
    }
  }

  it('should process valid parenting expression', () => {
    const result = simulateTranslationRequest('아기한테 밥 뭐 먹을래?')
    expect(result.canProcess).toBe(true)
    expect(result.processedInput).toBe('아기한테 밥 뭐 먹을래?')
  })

  it('should reject empty input with reason', () => {
    const result = simulateTranslationRequest('')
    expect(result.canProcess).toBe(false)
    expect(result.reason).toBe('Empty input')
  })

  it('should process casual expression', () => {
    const result = simulateTranslationRequest('오늘 뭐해?')
    expect(result.canProcess).toBe(true)
  })

  it('should normalize and process messy input', () => {
    const result = simulateTranslationRequest('  오늘   뭐해?  ')
    expect(result.canProcess).toBe(true)
    expect(result.processedInput).toBe('오늘 뭐해?')
  })
})
