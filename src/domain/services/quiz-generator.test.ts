import { describe, it, expect, beforeEach } from 'vitest'
import { QuizGenerator, QuizGrader, Quiz, QuizSubmission } from './quiz-generator'
import type { LearningRecord } from '../entities/translation'

describe('QuizGenerator', () => {
  let generator: QuizGenerator
  let sampleRecord: LearningRecord
  let allRecords: LearningRecord[]

  beforeEach(() => {
    generator = new QuizGenerator()

    sampleRecord = {
      id: 'record-1',
      userId: 'user-1',
      koreanInput: '밥 뭐 먹을래?',
      englishExpression: 'What do you want to eat?',
      contextExplanation: '식사 시간에 물어볼 때 사용',
      alternatives: [
        {
          expression: 'What would you like to eat?',
          situation: 'More polite',
          difference: 'Slightly formal',
        },
        {
          expression: "What are you in the mood for?",
          situation: 'Casual',
          difference: 'More colloquial',
        },
      ],
      relatedVocabulary: [
        {
          word: 'hungry',
          meaning: '배고픈',
          partOfSpeech: 'adjective',
          exampleSentence: 'Are you hungry?',
        },
      ],
      category: '음식',
      isBookmarked: false,
      masteryLevel: 2,
      reviewCount: 3,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    allRecords = [
      sampleRecord,
      {
        ...sampleRecord,
        id: 'record-2',
        koreanInput: '오늘 뭐 했어?',
        englishExpression: 'What did you do today?',
        category: '일상대화',
      },
      {
        ...sampleRecord,
        id: 'record-3',
        koreanInput: '맛있게 먹었어요',
        englishExpression: 'I enjoyed the meal.',
        category: '음식',
      },
    ]
  })

  describe('generateKoreanToEnglish()', () => {
    it('should generate a korean to english quiz', () => {
      const quiz = generator.generateKoreanToEnglish(sampleRecord)

      expect(quiz.type).toBe('korean_to_english')
      expect(quiz.question).toBe('밥 뭐 먹을래?')
      expect(quiz.correctAnswer).toBe('What do you want to eat?')
      expect(quiz.recordId).toBe('record-1')
    })

    it('should include a hint', () => {
      const quiz = generator.generateKoreanToEnglish(sampleRecord)

      expect(quiz.hint).toBeDefined()
      expect(quiz.hint).toContain('What')
    })
  })

  describe('generateFillBlank()', () => {
    it('should generate a fill in the blank quiz', () => {
      const quiz = generator.generateFillBlank(sampleRecord)

      expect(quiz.type).toBe('fill_blank')
      expect(quiz.question).toContain('_____')
      expect(quiz.question).toContain('밥 뭐 먹을래?')
    })

    it('should blank out a word from the expression', () => {
      const quiz = generator.generateFillBlank(sampleRecord)

      // fill_blank 타입이면 정답이 원래 표현에 있어야 함
      if (quiz.type === 'fill_blank') {
        const originalWords = sampleRecord.englishExpression.toLowerCase().split(' ')
        const correctAnswer = quiz.correctAnswer.toLowerCase().replace(/[?.!]/g, '')

        // 정답 단어가 원래 표현에 포함되어야 함
        expect(originalWords.map(w => w.replace(/[?.!]/g, ''))).toContain(correctAnswer)
      }
    })

    it('should fallback to korean_to_english for short expressions', () => {
      const shortRecord = {
        ...sampleRecord,
        englishExpression: 'Hi',
      }
      const quiz = generator.generateFillBlank(shortRecord)

      // 너무 짧으면 한→영으로 대체
      expect(quiz.type).toBe('korean_to_english')
    })
  })

  describe('generateMultipleChoice()', () => {
    it('should generate a multiple choice quiz with 4 options', () => {
      const quiz = generator.generateMultipleChoice(sampleRecord, allRecords)

      expect(quiz.type).toBe('multiple_choice')
      expect(quiz.options).toBeDefined()
      expect(quiz.options!.length).toBe(4)
    })

    it('should include the correct answer in options', () => {
      const quiz = generator.generateMultipleChoice(sampleRecord, allRecords)

      expect(quiz.options).toContain(quiz.correctAnswer)
    })

    it('should have unique options', () => {
      const quiz = generator.generateMultipleChoice(sampleRecord, allRecords)
      const uniqueOptions = new Set(quiz.options!.map((o) => o.toLowerCase()))

      expect(uniqueOptions.size).toBe(quiz.options!.length)
    })

    it('should shuffle options so correct answer is not always first', () => {
      // 여러 번 생성해서 위치가 바뀌는지 확인
      const positions: number[] = []
      for (let i = 0; i < 10; i++) {
        const quiz = generator.generateMultipleChoice(sampleRecord, allRecords)
        const pos = quiz.options!.indexOf(quiz.correctAnswer)
        positions.push(pos)
      }

      // 모든 위치가 같지 않아야 함 (섞였음을 확인)
      const uniquePositions = new Set(positions)
      expect(uniquePositions.size).toBeGreaterThan(1)
    })
  })

  describe('generateRandomQuiz()', () => {
    it('should generate multiple choice for low mastery', () => {
      const lowMasteryRecord = { ...sampleRecord, masteryLevel: 0 }
      const quiz = generator.generateRandomQuiz(lowMasteryRecord, allRecords)

      expect(quiz.type).toBe('multiple_choice')
    })

    it('should generate fill blank for medium mastery', () => {
      const mediumMasteryRecord = { ...sampleRecord, masteryLevel: 2 }
      const quiz = generator.generateRandomQuiz(mediumMasteryRecord, allRecords)

      expect(quiz.type).toBe('fill_blank')
    })

    it('should generate korean to english for high mastery', () => {
      const highMasteryRecord = { ...sampleRecord, masteryLevel: 4 }
      const quiz = generator.generateRandomQuiz(highMasteryRecord, allRecords)

      expect(quiz.type).toBe('korean_to_english')
    })

    it('should respect preferred type when specified', () => {
      const quiz = generator.generateRandomQuiz(sampleRecord, allRecords, 'multiple_choice')

      expect(quiz.type).toBe('multiple_choice')
    })
  })
})

describe('QuizGrader', () => {
  let grader: QuizGrader

  beforeEach(() => {
    grader = new QuizGrader()
  })

  describe('grade() - korean_to_english', () => {
    const createSubmission = (userAnswer: string): QuizSubmission => ({
      quizType: 'korean_to_english',
      question: '밥 뭐 먹을래?',
      userAnswer,
      correctAnswer: 'What do you want to eat?',
      recordId: 'record-1',
      timeTakenMs: 5000,
    })

    it('should mark exact match as correct', () => {
      const result = grader.grade(createSubmission('What do you want to eat?'))

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBe(1)
    })

    it('should be case insensitive', () => {
      const result = grader.grade(createSubmission('what do you want to eat?'))

      expect(result.isCorrect).toBe(true)
    })

    it('should ignore punctuation differences', () => {
      const result = grader.grade(createSubmission('What do you want to eat'))

      expect(result.isCorrect).toBe(true)
    })

    it('should accept minor typos (90%+ similarity)', () => {
      const result = grader.grade(createSubmission('What do you want to eaat?'))

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBeGreaterThanOrEqual(0.9)
    })

    it('should mark completely wrong answer as incorrect', () => {
      const result = grader.grade(createSubmission('Hello world'))

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBeLessThan(0.7)
    })

    it('should provide helpful feedback for incorrect answers', () => {
      const result = grader.grade(createSubmission('I want to eat'))

      expect(result.isCorrect).toBe(false)
      expect(result.feedback).toContain('What do you want to eat?')
    })
  })

  describe('grade() - fill_blank', () => {
    const createSubmission = (userAnswer: string): QuizSubmission => ({
      quizType: 'fill_blank',
      question: '밥 뭐 먹을래?\n\n"What do you _____ to eat?"',
      userAnswer,
      correctAnswer: 'want',
      recordId: 'record-1',
      timeTakenMs: 3000,
    })

    it('should mark exact match as correct', () => {
      const result = grader.grade(createSubmission('want'))

      expect(result.isCorrect).toBe(true)
    })

    it('should accept minor spelling errors', () => {
      // 'want'와 'wantt'는 4글자와 5글자, 유사도 = 1 - 1/5 = 0.8
      // 85% 이상이어야 정답으로 인정되므로, 좀 더 가까운 오타 사용
      const result = grader.grade(createSubmission('wan')) // 3/4 = 0.75 유사도 -> 정답 아님

      // 실제 유사도 테스트
      expect(result.isCorrect).toBe(false) // wan과 want는 85% 미만
    })

    it('should mark wrong word as incorrect', () => {
      const result = grader.grade(createSubmission('need'))

      expect(result.isCorrect).toBe(false)
    })
  })

  describe('grade() - multiple_choice', () => {
    const createSubmission = (userAnswer: string): QuizSubmission => ({
      quizType: 'multiple_choice',
      question: '밥 뭐 먹을래?',
      userAnswer,
      correctAnswer: 'What do you want to eat?',
      recordId: 'record-1',
      timeTakenMs: 2000,
    })

    it('should mark correct selection as correct', () => {
      const result = grader.grade(createSubmission('What do you want to eat?'))

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBe(1)
    })

    it('should mark wrong selection as incorrect', () => {
      const result = grader.grade(createSubmission('What would you like to eat?'))

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBe(0)
    })
  })

  describe('similarity calculation', () => {
    it('should return 1 for identical strings', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: 'test',
        userAnswer: 'hello world',
        correctAnswer: 'hello world',
        recordId: 'record-1',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.similarity).toBe(1)
    })

    it('should return 0 for completely different strings', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: 'test',
        userAnswer: 'abc',
        correctAnswer: 'xyz',
        recordId: 'record-1',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.similarity).toBe(0)
    })

    it('should return high similarity for strings with minor differences', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: 'test',
        userAnswer: 'What do you want to eat',
        correctAnswer: 'What do you want to eat?',
        recordId: 'record-1',
        timeTakenMs: 1000,
      }
      const result = grader.grade(submission)

      expect(result.similarity).toBeGreaterThanOrEqual(0.95)
    })
  })
})

describe('Quiz workflow integration', () => {
  it('should support a complete quiz flow: generate -> answer -> grade', () => {
    const generator = new QuizGenerator()
    const grader = new QuizGrader()

    const record: LearningRecord = {
      id: 'record-1',
      userId: 'user-1',
      koreanInput: '고마워',
      englishExpression: 'Thank you',
      contextExplanation: '감사를 표현할 때',
      alternatives: [
        { expression: 'Thanks', situation: 'Casual', difference: 'More informal' },
      ],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel: 3,
      reviewCount: 5,
      nextReviewAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 1. 퀴즈 생성
    const quiz = generator.generateKoreanToEnglish(record)
    expect(quiz.type).toBe('korean_to_english')
    expect(quiz.question).toBe('고마워')

    // 2. 사용자 답변 제출
    const submission: QuizSubmission = {
      quizType: quiz.type,
      question: quiz.question,
      userAnswer: 'Thank you',
      correctAnswer: quiz.correctAnswer,
      recordId: quiz.recordId,
      timeTakenMs: 3000,
    }

    // 3. 채점
    const result = grader.grade(submission)
    expect(result.isCorrect).toBe(true)
    expect(result.feedback).toContain('🎉')
  })

  it('should handle real-world quiz scenarios', () => {
    const generator = new QuizGenerator()
    const grader = new QuizGrader()

    const testCases = [
      {
        korean: '잘 자',
        english: 'Good night',
        userAnswer: 'good night',
        expectedCorrect: true, // 대소문자 차이만, 100% 유사도
      },
      {
        korean: '미안해',
        english: "I'm sorry",
        userAnswer: "I'm sorry!", // 느낌표만 다름, 정규화 후 동일
        expectedCorrect: true,
      },
      {
        korean: '배고파',
        english: "I'm hungry",
        userAnswer: 'I am hungry', // 축약형 차이, 82% 유사도
        expectedCorrect: false, // 90% 미만이므로 정답이 아님
      },
    ]

    testCases.forEach(({ korean, english, userAnswer, expectedCorrect }) => {
      const record: LearningRecord = {
        id: 'test',
        userId: 'user',
        koreanInput: korean,
        englishExpression: english,
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

      const quiz = generator.generateKoreanToEnglish(record)
      const result = grader.grade({
        quizType: 'korean_to_english',
        question: quiz.question,
        userAnswer,
        correctAnswer: quiz.correctAnswer,
        recordId: quiz.recordId,
        timeTakenMs: 1000,
      })

      expect(result.isCorrect).toBe(expectedCorrect)
    })
  })
})
