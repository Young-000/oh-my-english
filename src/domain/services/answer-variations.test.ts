import { describe, it, expect } from 'vitest'

/**
 * 퀴즈 정답 변형 허용 테스트
 *
 * 사용자가 약간 다른 형태로 답을 입력해도 정답으로 인정해야 하는 경우:
 * - 대소문자 차이
 * - 구두점 차이
 * - 축약형 vs 전체형
 * - 동의어/유사 표현
 * - 어순 변형
 */

/**
 * 정답 정규화 함수
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[?.!,'"]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Levenshtein 거리 계산
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * 유사도 계산 (0-1)
 */
function calculateSimilarity(answer: string, correct: string): number {
  const normAnswer = normalizeAnswer(answer)
  const normCorrect = normalizeAnswer(correct)

  if (normAnswer === normCorrect) return 1.0

  const distance = levenshteinDistance(normAnswer, normCorrect)
  const maxLength = Math.max(normAnswer.length, normCorrect.length)

  if (maxLength === 0) return 1.0
  return 1 - distance / maxLength
}

/**
 * 축약형 동등성 체크
 */
function areContractionsEquivalent(a: string, b: string): boolean {
  const contractionMap: Record<string, string> = {
    "i'm": "i am",
    "you're": "you are",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "i've": "i have",
    "you've": "you have",
    "we've": "we have",
    "they've": "they have",
    "i'll": "i will",
    "you'll": "you will",
    "he'll": "he will",
    "she'll": "she will",
    "we'll": "we will",
    "they'll": "they will",
    "i'd": "i would",
    "you'd": "you would",
    "he'd": "he would",
    "she'd": "she would",
    "we'd": "we would",
    "they'd": "they would",
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "won't": "will not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "can't": "cannot",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "let's": "let us",
    "that's": "that is",
    "what's": "what is",
    "who's": "who is",
    "where's": "where is",
    "where're": "where are",
    "there's": "there is",
    "here's": "here is",
    "gonna": "going to",
    "wanna": "want to",
    "gotta": "got to",
  }

  const normalizeWithContractions = (text: string): string => {
    let normalized = text.toLowerCase().trim()
    for (const [contraction, full] of Object.entries(contractionMap)) {
      normalized = normalized.replace(new RegExp(contraction, 'gi'), full)
    }
    return normalized.replace(/[?.!,'"]/g, '').replace(/\s+/g, ' ')
  }

  return normalizeWithContractions(a) === normalizeWithContractions(b)
}

/**
 * 정답 판정
 */
function isAnswerAcceptable(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.9
): { accepted: boolean; similarity: number; reason: string } {
  // 1. 정확히 일치
  if (normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
    return { accepted: true, similarity: 1.0, reason: 'exact match' }
  }

  // 2. 축약형 동등성
  if (areContractionsEquivalent(userAnswer, correctAnswer)) {
    return { accepted: true, similarity: 1.0, reason: 'contraction equivalent' }
  }

  // 3. 유사도 기반
  const similarity = calculateSimilarity(userAnswer, correctAnswer)
  if (similarity >= threshold) {
    return { accepted: true, similarity, reason: 'high similarity' }
  }

  return { accepted: false, similarity, reason: 'below threshold' }
}

describe('Answer Normalization', () => {
  describe('Case insensitivity', () => {
    const caseTests = [
      { answer: 'Hello', correct: 'hello' },
      { answer: 'HELLO', correct: 'hello' },
      { answer: 'HeLLo', correct: 'hello' },
      { answer: "I'm Happy", correct: "i'm happy" },
    ]

    caseTests.forEach(({ answer, correct }) => {
      it(`should normalize "${answer}" to match "${correct}"`, () => {
        expect(normalizeAnswer(answer)).toBe(normalizeAnswer(correct))
      })
    })
  })

  describe('Punctuation removal', () => {
    const punctuationTests = [
      { answer: 'Hello!', correct: 'Hello' },
      { answer: 'How are you?', correct: 'How are you' },
      { answer: "I'm fine, thanks.", correct: "Im fine thanks" },
      { answer: '"Hello"', correct: 'Hello' },
    ]

    punctuationTests.forEach(({ answer, correct }) => {
      it(`should normalize "${answer}" by removing punctuation`, () => {
        expect(normalizeAnswer(answer)).toBe(normalizeAnswer(correct))
      })
    })
  })

  describe('Whitespace normalization', () => {
    const whitespaceTests = [
      { answer: '  Hello  ', correct: 'Hello' },
      { answer: 'Hello   World', correct: 'Hello World' },
      { answer: 'How  are   you', correct: 'How are you' },
    ]

    whitespaceTests.forEach(({ answer, correct }) => {
      it(`should normalize whitespace in "${answer}"`, () => {
        expect(normalizeAnswer(answer)).toBe(normalizeAnswer(correct))
      })
    })
  })
})

describe('Contraction Equivalence', () => {
  describe('Subject contractions', () => {
    const subjectContractions = [
      { contracted: "I'm happy", full: "I am happy" },
      { contracted: "You're great", full: "You are great" },
      { contracted: "He's coming", full: "He is coming" },
      { contracted: "She's nice", full: "She is nice" },
      { contracted: "It's cold", full: "It is cold" },
      { contracted: "We're ready", full: "We are ready" },
      { contracted: "They're here", full: "They are here" },
    ]

    subjectContractions.forEach(({ contracted, full }) => {
      it(`should treat "${contracted}" as equivalent to "${full}"`, () => {
        expect(areContractionsEquivalent(contracted, full)).toBe(true)
      })
    })
  })

  describe('Negative contractions', () => {
    const negativeContractions = [
      { contracted: "don't", full: "do not" },
      { contracted: "doesn't", full: "does not" },
      { contracted: "didn't", full: "did not" },
      { contracted: "won't", full: "will not" },
      { contracted: "can't", full: "cannot" },
      { contracted: "couldn't", full: "could not" },
      { contracted: "shouldn't", full: "should not" },
      { contracted: "wouldn't", full: "would not" },
      { contracted: "isn't", full: "is not" },
      { contracted: "aren't", full: "are not" },
      { contracted: "wasn't", full: "was not" },
      { contracted: "weren't", full: "were not" },
      { contracted: "haven't", full: "have not" },
      { contracted: "hasn't", full: "has not" },
    ]

    negativeContractions.forEach(({ contracted, full }) => {
      it(`should treat "${contracted}" as equivalent to "${full}"`, () => {
        expect(areContractionsEquivalent(contracted, full)).toBe(true)
      })
    })
  })

  describe('Informal contractions', () => {
    const informalContractions = [
      { contracted: "I'm gonna go", full: "I am going to go" },
      { contracted: "I wanna eat", full: "I want to eat" },
      { contracted: "I gotta run", full: "I got to run" },
      { contracted: "Let's go", full: "Let us go" },
    ]

    informalContractions.forEach(({ contracted, full }) => {
      it(`should treat "${contracted}" as equivalent to "${full}"`, () => {
        expect(areContractionsEquivalent(contracted, full)).toBe(true)
      })
    })
  })

  describe('Full sentence contractions', () => {
    const sentenceContractions = [
      { contracted: "I'm going to the store", full: "I am going to the store" },
      { contracted: "She's eating dinner", full: "She is eating dinner" },
      { contracted: "They've finished work", full: "They have finished work" },
      { contracted: "We'll see you later", full: "We will see you later" },
      { contracted: "I don't know", full: "I do not know" },
      { contracted: "It's raining", full: "It is raining" },
    ]

    sentenceContractions.forEach(({ contracted, full }) => {
      it(`should accept both "${contracted}" and "${full}"`, () => {
        expect(areContractionsEquivalent(contracted, full)).toBe(true)
      })
    })
  })
})

describe('Similarity Calculation', () => {
  describe('Exact matches', () => {
    const exactMatches = [
      { answer: 'Hello', correct: 'Hello' },
      { answer: 'hello', correct: 'Hello' },
      { answer: 'HELLO', correct: 'hello' },
    ]

    exactMatches.forEach(({ answer, correct }) => {
      it(`should give 1.0 similarity for "${answer}" vs "${correct}"`, () => {
        expect(calculateSimilarity(answer, correct)).toBe(1.0)
      })
    })
  })

  describe('Minor typos', () => {
    const typoTests = [
      { answer: 'Helo', correct: 'Hello', minSimilarity: 0.8 },
      { answer: 'Helllo', correct: 'Hello', minSimilarity: 0.8 },
      { answer: 'Hwllo', correct: 'Hello', minSimilarity: 0.8 },
    ]

    typoTests.forEach(({ answer, correct, minSimilarity }) => {
      it(`should give high similarity for typo "${answer}" vs "${correct}"`, () => {
        expect(calculateSimilarity(answer, correct)).toBeGreaterThanOrEqual(minSimilarity)
      })
    })
  })

  describe('Major differences', () => {
    const differentTests = [
      { answer: 'Hello', correct: 'Goodbye', maxSimilarity: 0.5 },
      { answer: 'Yes', correct: 'No', maxSimilarity: 0.5 },
      { answer: 'Cat', correct: 'Dog', maxSimilarity: 0.5 },
    ]

    differentTests.forEach(({ answer, correct, maxSimilarity }) => {
      it(`should give low similarity for "${answer}" vs "${correct}"`, () => {
        expect(calculateSimilarity(answer, correct)).toBeLessThanOrEqual(maxSimilarity)
      })
    })
  })
})

describe('Answer Acceptance', () => {
  describe('Acceptable variations', () => {
    const acceptableTests = [
      { answer: "I'm happy", correct: "I am happy", reason: 'contraction' },
      { answer: "i am happy", correct: "I am happy", reason: 'case' },
      { answer: "I am happy!", correct: "I am happy", reason: 'punctuation' },
      { answer: "  I am happy  ", correct: "I am happy", reason: 'whitespace' },
      { answer: "I'm going to go", correct: "I am going to go", reason: 'contraction' },
      { answer: "dont worry", correct: "don't worry", reason: 'apostrophe missing' },
    ]

    acceptableTests.forEach(({ answer, correct, reason }) => {
      it(`should accept "${answer}" for "${correct}" (${reason})`, () => {
        const result = isAnswerAcceptable(answer, correct)
        expect(result.accepted).toBe(true)
      })
    })
  })

  describe('Unacceptable answers', () => {
    const unacceptableTests = [
      { answer: 'Hello', correct: 'Goodbye' },
      { answer: 'Yes', correct: 'No' },
      { answer: "I'm sad", correct: "I'm happy" },
      { answer: 'Good morning', correct: 'Good night' },
    ]

    unacceptableTests.forEach(({ answer, correct }) => {
      it(`should reject "${answer}" for "${correct}"`, () => {
        const result = isAnswerAcceptable(answer, correct)
        expect(result.accepted).toBe(false)
      })
    })
  })

  describe('Threshold sensitivity', () => {
    it('should accept with lower threshold', () => {
      const result = isAnswerAcceptable('Helo', 'Hello', 0.7)
      expect(result.accepted).toBe(true)
    })

    it('should reject with higher threshold', () => {
      const result = isAnswerAcceptable('Helo', 'Hello', 0.95)
      expect(result.accepted).toBe(false)
    })
  })
})

describe('Real Quiz Answer Scenarios', () => {
  describe('Korean to English quiz', () => {
    const koreanToEnglishTests = [
      {
        korean: '밥 먹었어?',
        correct: 'Have you eaten?',
        acceptableAnswers: [
          'Have you eaten?',
          'have you eaten',
          'Have you eaten',
          // Note: 'Did you eat?' is semantically equivalent but not string-similar.
          // The current implementation only checks string similarity and contractions,
          // not semantic equivalence. Semantic equivalence would require NLP/AI.
        ],
        unacceptableAnswers: [
          'I am hungry',
          'Let us eat',
        ],
      },
      {
        korean: '어디 가?',
        correct: 'Where are you going?',
        acceptableAnswers: [
          'Where are you going?',
          "Where're you going?",
          'where are you going',
          'Where are you going',
        ],
        unacceptableAnswers: [
          'I am going home',
          'To the store',
        ],
      },
    ]

    koreanToEnglishTests.forEach(({ korean, correct, acceptableAnswers, unacceptableAnswers }) => {
      describe(`for "${korean}"`, () => {
        acceptableAnswers.forEach((answer) => {
          it(`should accept "${answer}"`, () => {
            const result = isAnswerAcceptable(answer, correct)
            // 축약형/대소문자/구두점 허용
            if (!result.accepted) {
              // 축약형 체크
              expect(areContractionsEquivalent(answer, correct)).toBe(true)
            } else {
              expect(result.accepted).toBe(true)
            }
          })
        })

        unacceptableAnswers.forEach((answer) => {
          it(`should reject "${answer}"`, () => {
            const result = isAnswerAcceptable(answer, correct)
            expect(result.accepted).toBe(false)
          })
        })
      })
    })
  })

  describe('Fill in the blank quiz', () => {
    const fillBlankTests = [
      { blank: 'eaten', acceptableAnswers: ['eaten', 'Eaten', 'EATEN'] },
      { blank: 'going', acceptableAnswers: ['going', 'Going', 'GOING'] },
      { blank: 'beautiful', acceptableAnswers: ['beautiful', 'Beautiful', 'beautful'] }, // typo
    ]

    fillBlankTests.forEach(({ blank, acceptableAnswers }) => {
      describe(`for blank "${blank}"`, () => {
        acceptableAnswers.forEach((answer) => {
          it(`should accept "${answer}"`, () => {
            const result = isAnswerAcceptable(answer, blank, 0.85)
            expect(result.accepted).toBe(true)
          })
        })
      })
    })
  })

  describe('Common typos', () => {
    const typoTests = [
      { correct: 'beautiful', typos: ['beutiful', 'beautful', 'beatiful'] },
      { correct: 'definitely', typos: ['definately', 'definitly', 'definetly'] },
      { correct: 'tomorrow', typos: ['tommorrow', 'tommorow', 'tomorow'] },
      { correct: 'restaurant', typos: ['resturant', 'restarant', 'restraunt'] },
    ]

    typoTests.forEach(({ correct, typos }) => {
      describe(`for "${correct}"`, () => {
        typos.forEach((typo) => {
          it(`should have high similarity for common typo "${typo}"`, () => {
            const similarity = calculateSimilarity(typo, correct)
            expect(similarity).toBeGreaterThanOrEqual(0.7) // 일부 오타는 0.7 이상이면 충분
          })
        })
      })
    })
  })
})

describe('Edge Cases', () => {
  describe('Empty strings', () => {
    it('should handle empty answer', () => {
      const result = isAnswerAcceptable('', 'Hello')
      expect(result.accepted).toBe(false)
    })

    it('should handle whitespace-only answer', () => {
      const result = isAnswerAcceptable('   ', 'Hello')
      expect(result.accepted).toBe(false)
    })
  })

  describe('Very long answers', () => {
    it('should handle long answers', () => {
      const correct = 'I would like to know if you could possibly help me with this task'
      const answer = "I'd like to know if you could possibly help me with this task"
      const result = isAnswerAcceptable(answer, correct)
      expect(result.accepted).toBe(true)
    })
  })

  describe('Special characters', () => {
    it('should handle apostrophes correctly', () => {
      expect(isAnswerAcceptable("I'm", "I'm").accepted).toBe(true)
      expect(isAnswerAcceptable("Im", "I'm").accepted).toBe(true)
    })

    it('should handle dashes', () => {
      expect(isAnswerAcceptable('well-known', 'well known').accepted).toBe(true)
    })
  })

  describe('Numbers', () => {
    it('should handle numbers in answers', () => {
      expect(isAnswerAcceptable("I have 2 apples", "I have 2 apples").accepted).toBe(true)
      expect(isAnswerAcceptable("Meet at 3pm", "Meet at 3pm").accepted).toBe(true)
    })
  })
})
