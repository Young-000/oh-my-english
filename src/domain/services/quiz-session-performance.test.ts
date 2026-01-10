import { describe, it, expect, beforeEach } from 'vitest'
import { QuizGenerator, Quiz, QuizType } from './quiz-generator'
import type { LearningRecord } from '../entities/translation'

/**
 * 퀴즈 세션 성능 테스트
 *
 * 여러 퀴즈를 연속으로 생성/처리할 때의 일관성과 성능 검증:
 * - 퀴즈 생성 일관성
 * - 세션 내 다양성
 * - 메모리 사용 패턴
 * - 대량 처리 안정성
 */

describe('Quiz Session Performance', () => {
  let generator: QuizGenerator

  beforeEach(() => {
    generator = new QuizGenerator()
  })

  const createRecord = (overrides: Partial<LearningRecord> = {}): LearningRecord => ({
    id: `record-${Date.now()}-${Math.random()}`,
    userId: 'user-1',
    koreanInput: '테스트 입력',
    englishExpression: 'Test expression for quizzes',
    contextExplanation: '테스트 설명',
    alternatives: [
      { expression: 'Alternative one', situation: 'casual', difference: 'shorter' },
      { expression: 'Alternative two', situation: 'formal', difference: 'polite' },
    ],
    relatedVocabulary: [
      { word: 'test', meaning: '테스트', example: 'This is a test' },
    ],
    category: '일상대화',
    isBookmarked: false,
    masteryLevel: 2,
    reviewCount: 5,
    nextReviewAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  describe('Session Quiz Generation Consistency', () => {
    it('should generate consistent quiz types for same mastery level', () => {
      const record = createRecord({
        masteryLevel: 0,
        englishExpression: 'What do you want to eat for dinner?',
      })

      const quizTypes: QuizType[] = []
      for (let i = 0; i < 20; i++) {
        const quiz = generator.generateRandomQuiz(record, [])
        quizTypes.push(quiz.type)
      }

      // 마스터리 0은 주로 multiple_choice
      const multipleChoiceCount = quizTypes.filter((t) => t === 'multiple_choice').length
      expect(multipleChoiceCount).toBeGreaterThanOrEqual(15) // 75% 이상
    })

    it('should maintain correct answer consistency across multiple generations', () => {
      const record = createRecord({
        koreanInput: '밥 먹었어?',
        englishExpression: 'Have you eaten?',
      })

      for (let i = 0; i < 50; i++) {
        const quiz = generator.generateKoreanToEnglish(record)
        expect(quiz.correctAnswer).toBe('Have you eaten?')
        expect(quiz.question).toBe('밥 먹었어?')
      }
    })

    it('should always include recordId', () => {
      const record = createRecord({ id: 'unique-test-id' })

      for (let i = 0; i < 30; i++) {
        const quiz = generator.generateRandomQuiz(record, [])
        expect(quiz.recordId).toBe('unique-test-id')
      }
    })
  })

  describe('Session Diversity', () => {
    it('should generate diverse fill_blank words within a session', () => {
      const record = createRecord({
        masteryLevel: 3,
        englishExpression: 'I am going to the beautiful grocery store today',
      })

      const selectedWords = new Set<string>()
      for (let i = 0; i < 30; i++) {
        const quiz = generator.generateFillBlank(record)
        if (quiz.type === 'fill_blank') {
          selectedWords.add(quiz.correctAnswer.toLowerCase())
        }
      }

      // 여러 다른 단어가 선택되어야 함 (최소 2개 이상)
      expect(selectedWords.size).toBeGreaterThanOrEqual(2)
    })

    it('should shuffle multiple choice options differently each time', () => {
      const record = createRecord({
        englishExpression: 'Hello there',
      })
      const otherRecords = [
        createRecord({ id: '2', englishExpression: 'Hi' }),
        createRecord({ id: '3', englishExpression: 'Hey' }),
        createRecord({ id: '4', englishExpression: 'Greetings' }),
      ]

      const firstOptionPositions: number[] = []
      for (let i = 0; i < 20; i++) {
        const quiz = generator.generateMultipleChoice(record, otherRecords)
        firstOptionPositions.push(quiz.options!.indexOf('Hello there'))
      }

      const uniquePositions = new Set(firstOptionPositions)
      expect(uniquePositions.size).toBeGreaterThan(1) // 위치가 다양해야 함
    })
  })

  describe('Batch Quiz Generation', () => {
    it('should generate 100 quizzes without error', () => {
      const records = Array.from({ length: 20 }, (_, i) =>
        createRecord({
          id: `record-${i}`,
          koreanInput: `테스트 ${i}`,
          englishExpression: `This is test expression number ${i}`,
          masteryLevel: i % 6, // 0-5 순환
        })
      )

      const quizzes: Quiz[] = []
      for (let i = 0; i < 100; i++) {
        const record = records[i % records.length]
        const otherRecords = records.filter((r) => r.id !== record.id)
        const quiz = generator.generateRandomQuiz(record, otherRecords)
        quizzes.push(quiz)
      }

      expect(quizzes.length).toBe(100)
      quizzes.forEach((quiz) => {
        expect(quiz.type).toBeDefined()
        expect(quiz.question).toBeDefined()
        expect(quiz.correctAnswer).toBeDefined()
        expect(quiz.recordId).toBeDefined()
      })
    })

    it('should distribute quiz types according to mastery levels', () => {
      const typeCounts: Record<QuizType, number> = {
        multiple_choice: 0,
        fill_blank: 0,
        korean_to_english: 0,
      }

      // 각 마스터리 레벨에서 10개씩 생성
      for (let mastery = 0; mastery <= 5; mastery++) {
        for (let i = 0; i < 10; i++) {
          const record = createRecord({
            masteryLevel: mastery,
            englishExpression: 'What do you want to eat for dinner today?',
          })
          const quiz = generator.generateRandomQuiz(record, [])
          typeCounts[quiz.type]++
        }
      }

      // 다양한 타입이 생성되어야 함
      expect(typeCounts.multiple_choice).toBeGreaterThan(0)
      expect(typeCounts.fill_blank).toBeGreaterThan(0)
      expect(typeCounts.korean_to_english).toBeGreaterThan(0)
    })
  })

  describe('Edge Case Handling in Sessions', () => {
    it('should handle records with no alternatives gracefully', () => {
      const record = createRecord({
        alternatives: [],
        englishExpression: 'Simple test',
      })
      const otherRecords = [
        createRecord({ id: '2', englishExpression: 'Other one' }),
        createRecord({ id: '3', englishExpression: 'Other two' }),
      ]

      for (let i = 0; i < 20; i++) {
        const quiz = generator.generateMultipleChoice(record, otherRecords)
        expect(quiz.options).toBeDefined()
        expect(quiz.options!.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should handle very short expressions consistently', () => {
      const shortExpressions = ['Hi', 'OK', 'Yes', 'No', 'Bye']

      shortExpressions.forEach((expr) => {
        const record = createRecord({ englishExpression: expr })

        for (let i = 0; i < 10; i++) {
          const quiz = generator.generateFillBlank(record)
          // 짧은 표현은 korean_to_english로 폴백
          expect(['fill_blank', 'korean_to_english']).toContain(quiz.type)
          expect(quiz.correctAnswer.length).toBeGreaterThan(0)
        }
      })
    })

    it('should handle mixed language content', () => {
      const record = createRecord({
        koreanInput: '오늘 날씨 어때?',
        englishExpression: "How's the weather today?",
      })

      for (let i = 0; i < 20; i++) {
        const quiz = generator.generateRandomQuiz(record, [])
        expect(quiz).toBeDefined()
        expect(quiz.question).not.toContain(undefined)
        expect(quiz.correctAnswer).not.toContain(undefined)
      }
    })
  })

  describe('Quiz Quality in Extended Sessions', () => {
    it('should maintain hint quality throughout session', () => {
      const record = createRecord({
        englishExpression: 'What do you want to eat for dinner?',
      })

      for (let i = 0; i < 30; i++) {
        const quiz = generator.generateKoreanToEnglish(record)
        expect(quiz.hint).toBeDefined()
        expect(quiz.hint!.length).toBeGreaterThan(0)
        expect(quiz.hint!).toContain('What') // 첫 단어 포함
        expect(quiz.hint!).toContain('단어') // 단어 수 포함
      }
    })

    it('should maintain fill_blank hint quality', () => {
      const record = createRecord({
        masteryLevel: 3,
        englishExpression: 'I am going to the store to buy groceries',
      })

      for (let i = 0; i < 20; i++) {
        const quiz = generator.generateFillBlank(record)
        if (quiz.type === 'fill_blank') {
          expect(quiz.hint).toBeDefined()
          expect(quiz.hint!).toContain('글자') // 글자 수 힌트
        }
      }
    })

    it('should maintain multiple choice option quality', () => {
      const record = createRecord({
        englishExpression: 'Have you eaten dinner?',
        alternatives: [
          { expression: 'Did you eat?', situation: 'casual', difference: 'shorter' },
        ],
      })
      const otherRecords = [
        createRecord({ id: '2', category: '일상대화', englishExpression: 'How are you?' }),
        createRecord({ id: '3', category: '일상대화', englishExpression: 'Good morning!' }),
        createRecord({ id: '4', category: '비즈니스', englishExpression: 'Nice to meet you' }),
      ]

      for (let i = 0; i < 20; i++) {
        const quiz = generator.generateMultipleChoice(record, otherRecords)
        expect(quiz.options).toBeDefined()
        expect(quiz.options!.length).toBe(4)

        // 중복 없음
        const uniqueOptions = new Set(quiz.options!.map((o) => o.toLowerCase()))
        expect(uniqueOptions.size).toBe(quiz.options!.length)

        // 정답 포함
        expect(quiz.options!).toContain(quiz.correctAnswer)
      }
    })
  })

  describe('Stress Testing', () => {
    it('should handle rapid consecutive quiz generation', () => {
      const record = createRecord({
        englishExpression: 'This is a test expression for stress testing',
      })

      const startTime = Date.now()
      const quizzes: Quiz[] = []

      for (let i = 0; i < 500; i++) {
        quizzes.push(generator.generateRandomQuiz(record, []))
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(quizzes.length).toBe(500)
      expect(duration).toBeLessThan(1000) // 1초 이내 완료
    })

    it('should handle large record pool for multiple choice', () => {
      const records = Array.from({ length: 100 }, (_, i) =>
        createRecord({
          id: `record-${i}`,
          englishExpression: `Expression number ${i} for testing`,
          category: i % 3 === 0 ? '일상대화' : i % 3 === 1 ? '비즈니스' : '육아',
        })
      )

      const mainRecord = records[0]
      const otherRecords = records.slice(1)

      for (let i = 0; i < 50; i++) {
        const quiz = generator.generateMultipleChoice(mainRecord, otherRecords)
        expect(quiz.options!.length).toBe(4)
        expect(quiz.options!).toContain(quiz.correctAnswer)
      }
    })
  })
})

describe('Quiz Session State Tracking', () => {
  /**
   * 세션 상태 추적 시뮬레이션
   */
  interface SessionState {
    quizzesCompleted: number
    correctCount: number
    wrongCount: number
    averageTimeMs: number
    quizTypeDistribution: Record<QuizType, number>
  }

  function createSession(): SessionState {
    return {
      quizzesCompleted: 0,
      correctCount: 0,
      wrongCount: 0,
      averageTimeMs: 0,
      quizTypeDistribution: {
        multiple_choice: 0,
        fill_blank: 0,
        korean_to_english: 0,
      },
    }
  }

  function updateSession(
    session: SessionState,
    quiz: Quiz,
    isCorrect: boolean,
    timeMs: number
  ): SessionState {
    const newTotal = session.quizzesCompleted + 1
    return {
      quizzesCompleted: newTotal,
      correctCount: session.correctCount + (isCorrect ? 1 : 0),
      wrongCount: session.wrongCount + (isCorrect ? 0 : 1),
      averageTimeMs:
        (session.averageTimeMs * session.quizzesCompleted + timeMs) / newTotal,
      quizTypeDistribution: {
        ...session.quizTypeDistribution,
        [quiz.type]: session.quizTypeDistribution[quiz.type] + 1,
      },
    }
  }

  it('should track session state correctly', () => {
    let session = createSession()
    const generator = new QuizGenerator()

    const record = (masteryLevel: number) => ({
      id: `record-${masteryLevel}`,
      userId: 'user-1',
      koreanInput: '테스트',
      englishExpression: 'This is a test expression for quiz',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel,
      reviewCount: 0,
      nextReviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LearningRecord)

    // 10개 퀴즈 시뮬레이션
    for (let i = 0; i < 10; i++) {
      const quiz = generator.generateRandomQuiz(record(i % 6), [])
      const isCorrect = Math.random() > 0.3 // 70% 정답률
      const timeMs = 1000 + Math.random() * 4000 // 1-5초
      session = updateSession(session, quiz, isCorrect, timeMs)
    }

    expect(session.quizzesCompleted).toBe(10)
    expect(session.correctCount + session.wrongCount).toBe(10)
    expect(session.averageTimeMs).toBeGreaterThan(0)

    const totalTypes = Object.values(session.quizTypeDistribution).reduce((a, b) => a + b, 0)
    expect(totalTypes).toBe(10)
  })

  it('should calculate accuracy rate correctly', () => {
    let session = createSession()
    const generator = new QuizGenerator()

    const record: LearningRecord = {
      id: 'test',
      userId: 'user',
      koreanInput: '테스트',
      englishExpression: 'Test expression here',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [],
      category: '일상대화',
      isBookmarked: false,
      masteryLevel: 3,
      reviewCount: 0,
      nextReviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // 정확히 8/10 정답
    const answers = [true, true, true, true, true, true, true, true, false, false]
    answers.forEach((isCorrect) => {
      const quiz = generator.generateRandomQuiz(record, [])
      session = updateSession(session, quiz, isCorrect, 2000)
    })

    const accuracyRate = session.correctCount / session.quizzesCompleted
    expect(accuracyRate).toBe(0.8)
  })
})

describe('Quiz Generation with Empty Data', () => {
  let generator: QuizGenerator

  beforeEach(() => {
    generator = new QuizGenerator()
  })

  it('should handle empty vocabulary list', () => {
    const record: LearningRecord = {
      id: 'test',
      userId: 'user',
      koreanInput: '테스트',
      englishExpression: 'This is a test expression',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [], // 비어있음
      category: '일상대화',
      isBookmarked: false,
      masteryLevel: 2,
      reviewCount: 0,
      nextReviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const quiz = generator.generateRandomQuiz(record, [])
    expect(quiz).toBeDefined()
    // fill_blank인 경우 단어가 정답, 아니면 전체 표현이 정답
    if (quiz.type === 'fill_blank') {
      expect(record.englishExpression.toLowerCase()).toContain(quiz.correctAnswer.toLowerCase())
    } else {
      expect(quiz.correctAnswer).toBe('This is a test expression')
    }
  })

  it('should handle minimal record data', () => {
    const minimalRecord: LearningRecord = {
      id: 'min',
      userId: 'user',
      koreanInput: '안녕',
      englishExpression: 'Hello',
      contextExplanation: '',
      alternatives: [],
      relatedVocabulary: [],
      category: '',
      isBookmarked: false,
      masteryLevel: 0,
      reviewCount: 0,
      nextReviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    for (let i = 0; i < 10; i++) {
      const quiz = generator.generateRandomQuiz(minimalRecord, [])
      expect(quiz.type).toBeDefined()
      expect(quiz.correctAnswer).toBe('Hello')
    }
  })
})
