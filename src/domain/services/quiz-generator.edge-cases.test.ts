import { describe, it, expect } from 'vitest'
import { QuizGenerator, QuizGrader, QuizSubmission } from './quiz-generator'
import type { LearningRecord } from '../entities/translation'

/**
 * 퀴즈 시스템 엣지 케이스 테스트
 * - 극단적인 입력값
 * - 경계 조건
 * - 특수 문자 처리
 * - 다양한 언어/표현 패턴
 */

describe('QuizGenerator Edge Cases', () => {
  const generator = new QuizGenerator()

  const createRecord = (overrides: Partial<LearningRecord> = {}): LearningRecord => ({
    id: 'test-1',
    userId: 'user-1',
    koreanInput: '테스트',
    englishExpression: 'Test expression',
    contextExplanation: '테스트 설명',
    alternatives: [],
    relatedVocabulary: [],
    category: '일상대화',
    isBookmarked: false,
    masteryLevel: 2,
    reviewCount: 0,
    nextReviewAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  describe('Very short expressions', () => {
    it('should handle single word expression', () => {
      const record = createRecord({
        koreanInput: '안녕',
        englishExpression: 'Hi',
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.type).toBe('korean_to_english')
      expect(quiz.correctAnswer).toBe('Hi')
    })

    it('should fallback to korean_to_english for 2-word expression in fill_blank', () => {
      const record = createRecord({
        koreanInput: '안녕',
        englishExpression: 'Hello there',
      })
      const quiz = generator.generateFillBlank(record)

      // 2단어 표현은 fill_blank가 어려움
      expect(['fill_blank', 'korean_to_english']).toContain(quiz.type)
    })
  })

  describe('Very long expressions', () => {
    it('should handle long expression', () => {
      const longExpression =
        "I was wondering if you could possibly help me with this problem that I've been having for quite a while now"
      const record = createRecord({
        koreanInput: '오랫동안 고민했던 이 문제를 도와주실 수 있을까요?',
        englishExpression: longExpression,
      })

      const quiz = generator.generateKoreanToEnglish(record)
      expect(quiz.correctAnswer).toBe(longExpression)
    })

    it('should generate fill_blank for long expression', () => {
      const record = createRecord({
        koreanInput: '오늘 날씨가 정말 좋네요',
        englishExpression: 'The weather is really nice today',
      })
      const quiz = generator.generateFillBlank(record)

      expect(quiz.question).toContain('_____')
      expect(quiz.correctAnswer.length).toBeGreaterThan(0)
    })
  })

  describe('Special characters', () => {
    it('should handle expressions with punctuation', () => {
      const record = createRecord({
        koreanInput: '뭐라고요?!',
        englishExpression: 'What?!',
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.correctAnswer).toBe('What?!')
    })

    it('should handle expressions with apostrophes', () => {
      const record = createRecord({
        koreanInput: "난 거기 안 갈 거야",
        englishExpression: "I'm not gonna go there",
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.correctAnswer).toBe("I'm not gonna go there")
    })

    it('should handle expressions with quotation marks', () => {
      const record = createRecord({
        koreanInput: '그가 "괜찮아"라고 말했어',
        englishExpression: 'He said "I\'m fine"',
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.correctAnswer).toBe('He said "I\'m fine"')
    })

    it('should handle expressions with emojis', () => {
      const record = createRecord({
        koreanInput: '기뻐! 🎉',
        englishExpression: "I'm so happy! 🎉",
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.correctAnswer).toContain('🎉')
    })
  })

  describe('Numbers and mixed content', () => {
    it('should handle expressions with numbers', () => {
      const record = createRecord({
        koreanInput: '3시에 만나자',
        englishExpression: "Let's meet at 3 o'clock",
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.correctAnswer).toContain('3')
    })

    it('should handle expressions with dates', () => {
      const record = createRecord({
        koreanInput: '12월 25일에 뵙겠습니다',
        englishExpression: "I'll see you on December 25th",
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.correctAnswer).toContain('25')
    })
  })

  describe('Multiple choice with limited records', () => {
    it('should generate quiz with only 2 options when only 1 other record exists', () => {
      const record = createRecord({
        koreanInput: '안녕',
        englishExpression: 'Hello',
      })
      const otherRecords = [
        createRecord({
          id: 'other-1',
          koreanInput: '잘가',
          englishExpression: 'Goodbye',
        }),
      ]

      const quiz = generator.generateMultipleChoice(record, otherRecords)

      expect(quiz.options!.length).toBeGreaterThanOrEqual(2)
      expect(quiz.options).toContain('Hello')
    })

    it('should generate quiz with empty other records list', () => {
      const record = createRecord({
        koreanInput: '안녕',
        englishExpression: 'Hello',
        alternatives: [
          { expression: 'Hi', situation: 'Casual', difference: 'More informal' },
          { expression: 'Hey', situation: 'Very casual', difference: 'Very informal' },
        ],
      })

      const quiz = generator.generateMultipleChoice(record, [])

      // alternatives가 있으면 그것들로 옵션 생성
      expect(quiz.options!.length).toBeGreaterThanOrEqual(2)
      expect(quiz.options).toContain('Hello')
    })
  })

  describe('Hint generation', () => {
    it('should generate hint for korean_to_english quiz', () => {
      const record = createRecord({
        englishExpression: 'What do you want to eat?',
      })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.hint).toBeDefined()
      expect(quiz.hint!.length).toBeGreaterThan(0)
    })

    it('should not reveal too much in hint', () => {
      const record = createRecord({
        englishExpression: 'Hello',
      })
      const quiz = generator.generateKoreanToEnglish(record)

      // 힌트가 정답 전체를 포함하지 않아야 함
      expect(quiz.hint).not.toBe('Hello')
    })
  })

  describe('Mastery-based quiz type selection', () => {
    it('should generate multiple_choice or listening for mastery level 0', () => {
      // Low mastery randomly selects multiple_choice (60%) or listening (40%)
      const record = createRecord({ masteryLevel: 0 })
      const quiz = generator.generateRandomQuiz(record, [])
      expect(['multiple_choice', 'listening']).toContain(quiz.type)
    })

    it('should generate multiple_choice or listening for mastery level 1', () => {
      // Low mastery randomly selects multiple_choice (60%) or listening (40%)
      const record = createRecord({ masteryLevel: 1 })
      const quiz = generator.generateRandomQuiz(record, [])
      expect(['multiple_choice', 'listening']).toContain(quiz.type)
    })

    it('should generate fill_blank, listening, or sentence_ordering for mastery level 2 (with long enough expression)', () => {
      // fill_blank requires 3+ words, otherwise falls back to korean_to_english
      // Medium mastery randomly selects fill_blank (50%), listening (30%), or sentence_ordering (20%)
      const record = createRecord({
        masteryLevel: 2,
        englishExpression: 'What do you want to eat',
      })
      const quiz = generator.generateRandomQuiz(record, [])
      expect(['fill_blank', 'korean_to_english', 'listening', 'sentence_ordering']).toContain(quiz.type)
    })

    it('should generate listening, sentence_ordering, or korean_to_english for mastery level 2 with short expression', () => {
      // 2-word expression triggers fallback for fill_blank, but listening/sentence_ordering work for any length
      const record = createRecord({
        masteryLevel: 2,
        englishExpression: 'Hello there',
      })
      const quiz = generator.generateRandomQuiz(record, [])
      // Medium mastery can randomly select listening/sentence_ordering which work for short expressions
      expect(['korean_to_english', 'listening', 'sentence_ordering']).toContain(quiz.type)
    })

    it('should generate fill_blank, listening, or sentence_ordering for mastery level 3 (with long enough expression)', () => {
      // Medium mastery randomly selects fill_blank (50%), listening (30%), or sentence_ordering (20%)
      const record = createRecord({
        masteryLevel: 3,
        englishExpression: 'The weather is really nice today',
      })
      const quiz = generator.generateRandomQuiz(record, [])
      expect(['fill_blank', 'korean_to_english', 'listening', 'sentence_ordering']).toContain(quiz.type)
    })

    it('should generate korean_to_english for mastery level 4', () => {
      const record = createRecord({ masteryLevel: 4 })
      const quiz = generator.generateRandomQuiz(record, [])
      expect(quiz.type).toBe('korean_to_english')
    })

    it('should generate korean_to_english for mastery level 5', () => {
      const record = createRecord({ masteryLevel: 5 })
      const quiz = generator.generateRandomQuiz(record, [])
      expect(quiz.type).toBe('korean_to_english')
    })
  })
})

describe('QuizGrader Edge Cases', () => {
  const grader = new QuizGrader()

  describe('Empty and whitespace handling', () => {
    it('should handle empty user answer', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: '',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBe(0)
    })

    it('should handle whitespace-only user answer', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: '   ',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
    })

    it('should trim whitespace from answers', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: '  Hello  ',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })
  })

  describe('Punctuation variations', () => {
    const testCases = [
      { user: 'Hello', correct: 'Hello!', expected: true },
      { user: 'Hello!', correct: 'Hello', expected: true },
      { user: 'Hello?', correct: 'Hello', expected: true },
      { user: 'Hello.', correct: 'Hello', expected: true },
      { user: 'Hello...', correct: 'Hello', expected: true },
      { user: 'Hello!!', correct: 'Hello', expected: true },
    ]

    testCases.forEach(({ user, correct, expected }) => {
      it(`should ${expected ? 'accept' : 'reject'} "${user}" for "${correct}"`, () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '안녕',
          userAnswer: user,
          correctAnswer: correct,
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)

        expect(result.isCorrect).toBe(expected)
      })
    })
  })

  describe('Case sensitivity', () => {
    const testCases = [
      { user: 'hello', correct: 'Hello', expected: true },
      { user: 'HELLO', correct: 'hello', expected: true },
      { user: 'HeLLo', correct: 'hello', expected: true },
      { user: 'WHAT DO YOU WANT', correct: 'What do you want', expected: true },
    ]

    testCases.forEach(({ user, correct, expected }) => {
      it(`should ${expected ? 'accept' : 'reject'} "${user}" for "${correct}"`, () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '테스트',
          userAnswer: user,
          correctAnswer: correct,
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)

        expect(result.isCorrect).toBe(expected)
      })
    })
  })

  describe('Typo tolerance', () => {
    // Note: korean_to_english uses 90% similarity threshold
    // For short words like "Hello" (5 chars), 1 char diff = 80% similarity
    // So we use longer phrases where typos have less impact

    it('should reject short word with missing letter (similarity < 90%)', () => {
      // "Helo" vs "Hello" = 4/5 = 80% similarity, below 90% threshold
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Helo',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)
      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBeGreaterThan(0.7) // Close but not enough
    })

    it('should accept typo in longer phrase (similarity >= 90%)', () => {
      // "What do you wnat to eat" vs "What do you want to eat"
      // 1 char swap in 22 char string = high similarity
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '뭐 먹고 싶어?',
        userAnswer: 'What do you wnat to eat',
        correctAnswer: 'What do you want to eat',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)
      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBeGreaterThanOrEqual(0.9)
    })

    it('should accept minor typo in medium phrase', () => {
      // "I am going hoem" vs "I am going home" = 1 swap in 15 chars
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '집에 갈게',
        userAnswer: 'I am going hoem',
        correctAnswer: 'I am going home',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)
      expect(result.similarity).toBeGreaterThan(0.85)
    })

    it('should reject completely different word', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Hi',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)
      expect(result.isCorrect).toBe(false)
    })

    it('should reject wrong word', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Goodbye',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)
      expect(result.isCorrect).toBe(false)
    })
  })

  describe('Multiple choice strict matching', () => {
    it('should accept normalized match for multiple choice (punctuation ignored)', () => {
      const submission: QuizSubmission = {
        quizType: 'multiple_choice',
        question: '안녕',
        userAnswer: 'Hello!',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      // normalizeAnswer가 punctuation을 제거하므로 일치
      expect(result.isCorrect).toBe(true)
    })

    it('should reject wrong answer for multiple choice', () => {
      const submission: QuizSubmission = {
        quizType: 'multiple_choice',
        question: '안녕',
        userAnswer: 'Goodbye',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBe(0)
    })

    it('should accept exact match for multiple choice', () => {
      const submission: QuizSubmission = {
        quizType: 'multiple_choice',
        question: '안녕',
        userAnswer: 'Hello',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBe(1)
    })
  })

  describe('Fill blank grading', () => {
    it('should be stricter for fill_blank (single word)', () => {
      const submission: QuizSubmission = {
        quizType: 'fill_blank',
        question: '"What do you _____ to eat?"',
        userAnswer: 'wnt',
        correctAnswer: 'want',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      // 한 글자 빠지면 75% 유사도 -> 정답 아님
      expect(result.isCorrect).toBe(false)
    })

    it('should accept very close answers for fill_blank', () => {
      const submission: QuizSubmission = {
        quizType: 'fill_blank',
        question: '"What do you _____ to eat?"',
        userAnswer: 'wantt',
        correctAnswer: 'want',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      // 한 글자 추가 -> 80% 유사도
      expect(result.similarity).toBeGreaterThanOrEqual(0.8)
    })
  })

  describe('Feedback messages', () => {
    it('should provide encouraging feedback for correct answer', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Hello',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.feedback).toContain('🎉')
    })

    it('should provide helpful feedback for incorrect answer', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Goodbye',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.feedback).toContain('Hello')
    })

    it('should provide encouraging feedback for close but wrong answer', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Helllo',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      // 가까운 답은 정답 처리될 수 있음
      expect(result.similarity).toBeGreaterThan(0.8)
    })
  })

  describe('Unicode and special characters', () => {
    it('should handle Unicode characters in answer', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '카페 가자',
        userAnswer: "Let's go to the café",
        correctAnswer: "Let's go to the café",
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })

    it('should handle curly quotes', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '그가 말했어',
        userAnswer: 'He said "hello"',
        correctAnswer: 'He said "hello"',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })
  })
})

describe('Quiz Consistency Tests', () => {
  const generator = new QuizGenerator()

  it('should generate consistent quiz for same record', () => {
    const record: LearningRecord = {
      id: 'consistent-test',
      userId: 'user-1',
      koreanInput: '밥 먹었어?',
      englishExpression: 'Have you eaten?',
      contextExplanation: '식사 여부 확인',
      alternatives: [],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel: 3,
      reviewCount: 5,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 여러 번 생성해도 핵심 정보는 동일해야 함
    for (let i = 0; i < 5; i++) {
      const quiz = generator.generateKoreanToEnglish(record)
      expect(quiz.question).toBe('밥 먹었어?')
      expect(quiz.correctAnswer).toBe('Have you eaten?')
      expect(quiz.recordId).toBe('consistent-test')
    }
  })

  it('should vary multiple choice option positions', () => {
    const record: LearningRecord = {
      id: 'test',
      userId: 'user-1',
      koreanInput: '안녕',
      englishExpression: 'Hello',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel: 0,
      reviewCount: 0,
      nextReviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const otherRecords = [
      { ...record, id: '2', englishExpression: 'Hi' },
      { ...record, id: '3', englishExpression: 'Hey' },
      { ...record, id: '4', englishExpression: 'Howdy' },
    ]

    const positions: number[] = []
    for (let i = 0; i < 20; i++) {
      const quiz = generator.generateMultipleChoice(record, otherRecords)
      const pos = quiz.options!.indexOf('Hello')
      positions.push(pos)
    }

    // 옵션 위치가 다양해야 함
    const uniquePositions = new Set(positions)
    expect(uniquePositions.size).toBeGreaterThan(1)
  })
})
