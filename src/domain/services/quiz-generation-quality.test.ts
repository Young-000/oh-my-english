import { describe, it, expect } from 'vitest'
import { QuizGenerator, QuizType } from './quiz-generator'
import type { LearningRecord } from '../entities/translation'

/**
 * 퀴즈 생성 품질 심층 테스트
 *
 * - 빈칸 채우기 단어 선택 품질
 * - 객관식 오답 품질
 * - 퀴즈 다양성
 * - 힌트 적절성
 */

describe('Quiz Generation Quality', () => {
  const generator = new QuizGenerator()

  const createRecord = (overrides: Partial<LearningRecord> = {}): LearningRecord => ({
    id: 'test-1',
    userId: 'user-1',
    koreanInput: '밥 먹었어?',
    englishExpression: 'Have you eaten?',
    contextExplanation: '식사 여부를 물어보는 표현',
    alternatives: [
      { expression: 'Did you eat?', situation: '과거형', difference: '더 직접적' },
      { expression: 'Have you had anything?', situation: '포괄적', difference: '음식 전반' },
    ],
    relatedVocabulary: [
      { word: 'eat', meaning: '먹다', partOfSpeech: 'verb', exampleSentence: 'I eat breakfast at 7am' },
      { word: 'meal', meaning: '식사', partOfSpeech: 'noun', exampleSentence: 'We had a nice meal' },
    ],
    category: '일상대화',
    isBookmarked: false,
    masteryLevel: 2,
    reviewCount: 3,
    nextReviewAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  describe('Fill-in-the-blank Word Selection', () => {
    describe('Content word selection', () => {
      // 기본 기능어 목록 (QuizGenerator의 functionWords와 동일)
      const functionWords = new Set([
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been',
        'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'and', 'or',
        'but', 'if', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'my', 'your', 'his', 'her', 'its', 'our', 'their',
        'do', 'does', 'did', 'have', 'has', 'had',
        'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
      ])

      const testCases = [
        { expression: 'She is reading a wonderful book today' },
        { expression: 'I am going to the grocery store now' },
        { expression: 'They have been working very hard lately' },
        { expression: 'We will definitely visit the beautiful park tomorrow' },
      ]

      testCases.forEach(({ expression }) => {
        it(`should select content word (not function word) for "${expression.substring(0, 30)}..."`, () => {
          const record = createRecord({ englishExpression: expression })
          const quiz = generator.generateFillBlank(record)

          expect(quiz).toBeDefined()

          if (quiz.type === 'fill_blank') {
            const correctAnswer = quiz.correctAnswer.toLowerCase().replace(/[?.!,]/g, '')
            // 선택된 단어가 기능어가 아니어야 함
            expect(functionWords.has(correctAnswer)).toBe(false)
            // 2글자 이하 단어가 아니어야 함
            expect(correctAnswer.length).toBeGreaterThan(2)
          }
        })
      })
    })

    describe('Blank position in question', () => {
      it('should include blank placeholder in question', () => {
        const record = createRecord({
          englishExpression: 'What do you want to eat today?',
        })
        const quiz = generator.generateFillBlank(record)

        if (quiz.type === 'fill_blank') {
          expect(quiz.question).toContain('_____')
        }
      })

      it('should include Korean input in fill_blank question', () => {
        const record = createRecord({
          koreanInput: '오늘 뭐 먹고 싶어?',
          englishExpression: 'What do you want to eat today?',
        })
        const quiz = generator.generateFillBlank(record)

        if (quiz.type === 'fill_blank') {
          expect(quiz.question).toContain('오늘 뭐 먹고 싶어?')
        }
      })
    })

    describe('Word length hint', () => {
      it('should provide word length hint', () => {
        const record = createRecord({
          englishExpression: 'What do you want to eat?',
        })
        const quiz = generator.generateFillBlank(record)

        if (quiz.type === 'fill_blank' && quiz.hint) {
          expect(quiz.hint).toMatch(/\d+글자/)
        }
      })
    })
  })

  describe('Multiple Choice Answer Quality', () => {
    describe('Wrong answer generation', () => {
      it('should generate 4 total options (1 correct + 3 wrong)', () => {
        const record = createRecord()
        const otherRecords = [
          createRecord({ id: '2', englishExpression: 'Good morning!' }),
          createRecord({ id: '3', englishExpression: 'How are you?' }),
          createRecord({ id: '4', englishExpression: 'Nice to meet you' }),
        ]

        const quiz = generator.generateMultipleChoice(record, otherRecords)

        expect(quiz.options).toBeDefined()
        expect(quiz.options!.length).toBe(4)
        expect(quiz.options).toContain(quiz.correctAnswer)
      })

      it('should use alternatives as wrong answers when available', () => {
        const record = createRecord({
          englishExpression: 'Have you eaten?',
          alternatives: [
            { expression: 'Did you eat?', situation: 'casual', difference: 'more direct' },
            { expression: 'Have you had lunch?', situation: 'specific', difference: 'lunch only' },
          ],
        })

        const quiz = generator.generateMultipleChoice(record, [])

        expect(quiz.options).toBeDefined()
        // alternatives에서 오답이 포함되어야 함
        const hasAlternative = quiz.options!.some(
          (opt) => opt === 'Did you eat?' || opt === 'Have you had lunch?'
        )
        expect(hasAlternative).toBe(true)
      })

      it('should prefer same category records for wrong answers', () => {
        const record = createRecord({
          category: '일상대화',
          englishExpression: 'How are you?',
        })

        const sameCategory = [
          createRecord({ id: '2', category: '일상대화', englishExpression: 'Good morning' }),
          createRecord({ id: '3', category: '일상대화', englishExpression: 'Nice day' }),
        ]
        const differentCategory = [
          createRecord({ id: '4', category: '비즈니스', englishExpression: 'Please review the report' }),
        ]

        const quiz = generator.generateMultipleChoice(record, [...sameCategory, ...differentCategory])

        expect(quiz.options).toBeDefined()
        // 같은 카테고리 옵션이 우선적으로 포함되어야 함
        const hasSameCategory = quiz.options!.some(
          (opt) => opt === 'Good morning' || opt === 'Nice day'
        )
        expect(hasSameCategory).toBe(true)
      })
    })

    describe('Option distinctiveness', () => {
      it('should not have duplicate options', () => {
        const record = createRecord()
        const otherRecords = Array.from({ length: 10 }, (_, i) =>
          createRecord({ id: `${i}`, englishExpression: `Expression ${i}` })
        )

        const quiz = generator.generateMultipleChoice(record, otherRecords)

        const uniqueOptions = new Set(quiz.options!.map((o) => o.toLowerCase()))
        expect(uniqueOptions.size).toBe(quiz.options!.length)
      })

      it('should shuffle option positions', () => {
        const record = createRecord({
          englishExpression: 'Hello',
        })
        const otherRecords = [
          createRecord({ id: '2', englishExpression: 'Hi' }),
          createRecord({ id: '3', englishExpression: 'Hey' }),
          createRecord({ id: '4', englishExpression: 'Greetings' }),
        ]

        // 여러 번 생성해서 위치가 다양한지 확인
        const positions: number[] = []
        for (let i = 0; i < 20; i++) {
          const quiz = generator.generateMultipleChoice(record, otherRecords)
          positions.push(quiz.options!.indexOf('Hello'))
        }

        const uniquePositions = new Set(positions)
        expect(uniquePositions.size).toBeGreaterThan(1)
      })
    })
  })

  describe('Korean to English Quiz Quality', () => {
    describe('Hint quality', () => {
      it('should generate hint with first word for multi-word expression', () => {
        const record = createRecord({
          englishExpression: 'What do you want to eat?',
        })
        const quiz = generator.generateKoreanToEnglish(record)

        expect(quiz.hint).toBeDefined()
        expect(quiz.hint!.toLowerCase()).toContain('what')
      })

      it('should generate hint with first letter for single-word expression', () => {
        const record = createRecord({
          englishExpression: 'Hello',
        })
        const quiz = generator.generateKoreanToEnglish(record)

        expect(quiz.hint).toBeDefined()
        expect(quiz.hint!.toLowerCase()).toContain('h')
      })

      it('should include word count in hint', () => {
        const record = createRecord({
          englishExpression: 'What do you want to eat?',
        })
        const quiz = generator.generateKoreanToEnglish(record)

        expect(quiz.hint).toBeDefined()
        // "6단어" 또는 비슷한 패턴
        expect(quiz.hint).toMatch(/\d+단어/)
      })
    })
  })

  describe('Quiz Diversity', () => {
    describe('Random quiz type distribution', () => {
      it('should generate different quiz types based on mastery', () => {
        const quizTypes: QuizType[] = []

        // 각 마스터리 레벨에서 퀴즈 생성
        for (let mastery = 0; mastery <= 5; mastery++) {
          const record = createRecord({
            masteryLevel: mastery,
            englishExpression: 'What do you want to eat today please?',
          })
          const quiz = generator.generateRandomQuiz(record, [])
          quizTypes.push(quiz.type)
        }

        // 다양한 타입이 생성되어야 함
        const uniqueTypes = new Set(quizTypes)
        expect(uniqueTypes.size).toBeGreaterThanOrEqual(2)
      })

      it('should respect preferredType when specified', () => {
        const record = createRecord({
          masteryLevel: 0, // 보통은 multiple_choice
          englishExpression: 'What do you want to eat?',
        })

        const quiz = generator.generateRandomQuiz(record, [], 'korean_to_english')
        expect(quiz.type).toBe('korean_to_english')
      })
    })
  })

  describe('Edge Cases in Quiz Generation', () => {
    describe('Short expressions', () => {
      const shortExpressions = ['Hi', 'OK', 'Yes', 'No', 'Thanks']

      shortExpressions.forEach((expr) => {
        it(`should handle short expression "${expr}"`, () => {
          const record = createRecord({
            englishExpression: expr,
          })

          // 모든 퀴즈 타입이 에러 없이 생성되어야 함
          const koreanToEnglish = generator.generateKoreanToEnglish(record)
          expect(koreanToEnglish.type).toBe('korean_to_english')

          const fillBlank = generator.generateFillBlank(record)
          // 짧은 표현은 fill_blank 대신 korean_to_english로 폴백
          expect(['fill_blank', 'korean_to_english']).toContain(fillBlank.type)

          const multipleChoice = generator.generateMultipleChoice(record, [])
          expect(multipleChoice.type).toBe('multiple_choice')
        })
      })
    })

    describe('Long expressions', () => {
      it('should handle very long expression', () => {
        const longExpr =
          "I was wondering if you could possibly help me understand this concept because I've been having some trouble with it for quite a while now"
        const record = createRecord({
          englishExpression: longExpr,
        })

        const quiz = generator.generateFillBlank(record)
        expect(quiz).toBeDefined()
        expect(quiz.type).toBe('fill_blank')
      })
    })

    describe('Special characters', () => {
      const specialCases = [
        { expr: "What's up?", desc: 'contraction' },
        { expr: 'Hello!!!', desc: 'multiple punctuation' },
        { expr: "I'm fine, thanks.", desc: 'comma and period' },
        { expr: 'Hey... how are you?', desc: 'ellipsis' },
      ]

      specialCases.forEach(({ expr, desc }) => {
        it(`should handle ${desc}: "${expr}"`, () => {
          const record = createRecord({
            englishExpression: expr,
          })

          const quiz = generator.generateKoreanToEnglish(record)
          expect(quiz.correctAnswer).toBe(expr)
        })
      })
    })
  })
})

describe('Quiz Content Appropriateness', () => {
  const generator = new QuizGenerator()

  describe('Answer consistency', () => {
    it('should have consistent correct answer', () => {
      const record: LearningRecord = {
        id: 'test',
        userId: 'user',
        koreanInput: '안녕하세요',
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

      // 여러 번 생성해도 정답은 동일해야 함
      for (let i = 0; i < 10; i++) {
        const quiz = generator.generateKoreanToEnglish(record)
        expect(quiz.correctAnswer).toBe('Hello')
      }
    })
  })

  describe('Question-answer alignment', () => {
    it('should have question matching the Korean input', () => {
      const record: LearningRecord = {
        id: 'test',
        userId: 'user',
        koreanInput: '밥 먹었어?',
        englishExpression: 'Have you eaten?',
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

      const quiz = generator.generateKoreanToEnglish(record)
      expect(quiz.question).toBe('밥 먹었어?')
      expect(quiz.correctAnswer).toBe('Have you eaten?')
    })
  })

  describe('Record ID tracking', () => {
    it('should include correct recordId in quiz', () => {
      const record: LearningRecord = {
        id: 'unique-record-id-123',
        userId: 'user',
        koreanInput: '테스트',
        englishExpression: 'Test',
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
      expect(quiz.recordId).toBe('unique-record-id-123')
    })
  })
})

describe('Fill Blank Quality Metrics', () => {
  const generator = new QuizGenerator()

  // QuizGenerator에서 정의된 기능어 목록
  const functionWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been',
    'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'and', 'or',
    'but', 'if', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'do', 'does', 'did', 'have', 'has', 'had',
    'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
  ])

  describe('Meaningful word selection', () => {
    const testCases = [
      { expression: 'She definitely loves playing basketball with wonderful friends' },
      { expression: 'They absolutely enjoy reading interesting books together' },
    ]

    testCases.forEach(({ expression }) => {
      it(`should not select function word from "${expression.substring(0, 30)}..."`, () => {
        const record: LearningRecord = {
          id: 'test',
          userId: 'user',
          koreanInput: '테스트',
          englishExpression: expression,
          contextExplanation: '',
          alternatives: [],
          relatedVocabulary: [],
          category: '일상대화',
          isBookmarked: false,
          masteryLevel: 2,
          reviewCount: 0,
          nextReviewAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const quiz = generator.generateFillBlank(record)

        if (quiz.type === 'fill_blank') {
          const correctAnswer = quiz.correctAnswer.toLowerCase().replace(/[?.!,]/g, '')
          // QuizGenerator의 기능어 목록에 있는 단어가 선택되지 않아야 함
          expect(functionWords.has(correctAnswer)).toBe(false)
          // 2글자 이하 단어가 선택되지 않아야 함
          expect(correctAnswer.length).toBeGreaterThan(2)
        }
      })
    })
  })
})
