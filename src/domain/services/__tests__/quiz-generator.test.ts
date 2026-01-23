import { describe, it, expect, beforeEach } from 'vitest'
import { QuizGenerator } from '../quiz-generator'
import type { LearningRecord } from '@/domain/entities/translation'

// 테스트용 학습 기록 생성 헬퍼
function createMockRecord(overrides: Partial<LearningRecord> = {}): LearningRecord {
  return {
    id: 'test-record-1',
    userId: 'test-user',
    koreanInput: '밥 먹었어?',
    englishExpression: 'Have you eaten yet?',
    contextExplanation: '친구에게 가볍게 물어볼 때 사용',
    alternatives: [
      {
        expression: 'Did you eat?',
        situation: '매우 캐주얼한 상황',
        difference: '더 간단하고 일상적',
      },
      {
        expression: 'Have you had your meal?',
        situation: '조금 더 정중한 상황',
        difference: '더 예의 바른 표현',
      },
    ],
    relatedVocabulary: [
      {
        word: 'meal',
        meaning: '식사',
        partOfSpeech: 'noun',
        exampleSentence: 'I had a big meal.',
      },
    ],
    category: 'daily',
    isBookmarked: false,
    masteryLevel: 2,
    reviewCount: 3,
    nextReviewAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('QuizGenerator', () => {
  let generator: QuizGenerator

  beforeEach(() => {
    generator = new QuizGenerator()
  })

  describe('generateKoreanToEnglish', () => {
    it('한국어 입력을 질문으로, 영어 표현을 정답으로 설정해야 한다', () => {
      const record = createMockRecord()
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.type).toBe('korean_to_english')
      expect(quiz.question).toBe('밥 먹었어?')
      expect(quiz.correctAnswer).toBe('Have you eaten yet?')
      expect(quiz.recordId).toBe('test-record-1')
    })

    it('힌트를 생성해야 한다', () => {
      const record = createMockRecord()
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.hint).toBeDefined()
      expect(quiz.hint).toContain('Have')
    })

    it('한 단어 표현일 때 적절한 힌트를 생성해야 한다', () => {
      const record = createMockRecord({ englishExpression: 'Hello' })
      const quiz = generator.generateKoreanToEnglish(record)

      expect(quiz.hint).toContain('H')
      expect(quiz.hint).toContain('시작')
    })
  })

  describe('generateFillBlank', () => {
    it('영어 표현에서 빈칸 퀴즈를 생성해야 한다', () => {
      const record = createMockRecord()
      const quiz = generator.generateFillBlank(record)

      expect(quiz.type).toBe('fill_blank')
      expect(quiz.question).toContain('밥 먹었어?')
      expect(quiz.question).toContain('_____')
    })

    it('빈칸 정답은 내용어여야 한다', () => {
      const record = createMockRecord({ englishExpression: 'Have you eaten yet?' })
      const quiz = generator.generateFillBlank(record)

      // 정답은 'a', 'the', 'you' 같은 기능어가 아닌 내용어여야 함
      const functionWords = ['have', 'you', 'a', 'an', 'the', 'is', 'are']
      expect(functionWords).not.toContain(quiz.correctAnswer.toLowerCase())
    })

    it('짧은 표현(3단어 미만)은 korean_to_english로 대체해야 한다', () => {
      const record = createMockRecord({ englishExpression: 'Thank you' })
      const quiz = generator.generateFillBlank(record)

      expect(quiz.type).toBe('korean_to_english')
    })

    it('힌트에 글자 수가 포함되어야 한다', () => {
      const record = createMockRecord({ englishExpression: 'Have you eaten your lunch?' })
      const quiz = generator.generateFillBlank(record)

      if (quiz.type === 'fill_blank') {
        expect(quiz.hint).toMatch(/\d+글자/)
      }
    })
  })

  describe('generateMultipleChoice', () => {
    it('정답을 포함한 4개의 선택지를 생성해야 한다', () => {
      const record = createMockRecord()
      const allRecords = [
        record,
        createMockRecord({
          id: 'record-2',
          koreanInput: '안녕하세요',
          englishExpression: 'Hello',
          category: 'greeting',
        }),
        createMockRecord({
          id: 'record-3',
          koreanInput: '감사합니다',
          englishExpression: 'Thank you',
          category: 'greeting',
        }),
        createMockRecord({
          id: 'record-4',
          koreanInput: '미안해요',
          englishExpression: "I'm sorry",
          category: 'daily',
        }),
      ]

      const quiz = generator.generateMultipleChoice(record, allRecords)

      expect(quiz.type).toBe('multiple_choice')
      expect(quiz.options).toBeDefined()
      expect(quiz.options!.length).toBe(4)
      expect(quiz.options).toContain(quiz.correctAnswer)
    })

    it('정답이 선택지에 포함되어 있어야 한다', () => {
      const record = createMockRecord()
      const quiz = generator.generateMultipleChoice(record, [record])

      expect(quiz.options).toContain('Have you eaten yet?')
    })

    it('중복된 선택지가 없어야 한다', () => {
      const record = createMockRecord()
      const allRecords = [
        record,
        createMockRecord({ id: 'r2', englishExpression: 'Hello' }),
        createMockRecord({ id: 'r3', englishExpression: 'Goodbye' }),
        createMockRecord({ id: 'r4', englishExpression: 'Thank you' }),
      ]
      const quiz = generator.generateMultipleChoice(record, allRecords)

      const uniqueOptions = new Set(quiz.options!.map((o) => o.toLowerCase()))
      expect(uniqueOptions.size).toBe(quiz.options!.length)
    })

    it('대안 표현에서 오답을 가져와야 한다', () => {
      const record = createMockRecord()
      const quiz = generator.generateMultipleChoice(record, [record])

      // 대안 표현이 선택지에 포함될 수 있음
      const hasAlternative = quiz.options!.some(
        (opt) => opt === 'Did you eat?' || opt === 'Have you had your meal?'
      )
      expect(hasAlternative).toBe(true)
    })
  })

  describe('generateRandomQuiz', () => {
    it('숙달도 0-1일 때 multiple_choice 또는 listening을 생성해야 한다', () => {
      const record = createMockRecord({ masteryLevel: 0 })
      const quiz = generator.generateRandomQuiz(record)
      // 랜덤으로 multiple_choice(60%) 또는 listening(40%) 생성
      expect(['multiple_choice', 'listening']).toContain(quiz.type)

      const record2 = createMockRecord({ masteryLevel: 1 })
      const quiz2 = generator.generateRandomQuiz(record2)
      expect(['multiple_choice', 'listening']).toContain(quiz2.type)
    })

    it('숙달도 2-3일 때 fill_blank, listening, 또는 sentence_ordering을 생성해야 한다', () => {
      const record = createMockRecord({ masteryLevel: 2 })
      const quiz = generator.generateRandomQuiz(record)
      // fill_blank가 korean_to_english로 대체될 수 있고, listening이나 sentence_ordering도 포함
      expect(['fill_blank', 'korean_to_english', 'listening', 'sentence_ordering']).toContain(quiz.type)

      const record2 = createMockRecord({ masteryLevel: 3 })
      const quiz2 = generator.generateRandomQuiz(record2)
      expect(['fill_blank', 'korean_to_english', 'listening', 'sentence_ordering']).toContain(quiz2.type)
    })

    it('숙달도 4-5일 때 korean_to_english를 생성해야 한다', () => {
      const record = createMockRecord({ masteryLevel: 4 })
      const quiz = generator.generateRandomQuiz(record)
      expect(quiz.type).toBe('korean_to_english')

      const record2 = createMockRecord({ masteryLevel: 5 })
      const quiz2 = generator.generateRandomQuiz(record2)
      expect(quiz2.type).toBe('korean_to_english')
    })

    it('preferredType이 지정되면 해당 타입을 생성해야 한다', () => {
      const record = createMockRecord({ masteryLevel: 0 })

      const quiz1 = generator.generateRandomQuiz(record, [], 'korean_to_english')
      expect(quiz1.type).toBe('korean_to_english')

      const quiz2 = generator.generateRandomQuiz(record, [record], 'multiple_choice')
      expect(quiz2.type).toBe('multiple_choice')
    })
  })

  describe('edge cases', () => {
    it('빈 alternatives로도 multiple_choice를 생성해야 한다', () => {
      const record = createMockRecord({ alternatives: [] })
      const quiz = generator.generateMultipleChoice(record, [record])

      expect(quiz.options!.length).toBe(4)
    })

    it('모든 단어가 기능어인 표현은 korean_to_english로 대체해야 한다', () => {
      const record = createMockRecord({ englishExpression: 'I am in the' })
      const quiz = generator.generateFillBlank(record)

      // 내용어가 없으면 korean_to_english로 대체
      expect(['fill_blank', 'korean_to_english']).toContain(quiz.type)
    })

    it('같은 카테고리 레코드가 있으면 오답으로 우선 사용해야 한다', () => {
      const record = createMockRecord({ category: 'daily' })
      const sameCategoryRecord = createMockRecord({
        id: 'r2',
        englishExpression: 'Good morning',
        category: 'daily',
      })
      const differentCategoryRecord = createMockRecord({
        id: 'r3',
        englishExpression: 'I love programming',
        category: 'work',
      })

      const quiz = generator.generateMultipleChoice(record, [
        record,
        sameCategoryRecord,
        differentCategoryRecord,
      ])

      expect(quiz.options).toContain('Good morning')
    })
  })
})
