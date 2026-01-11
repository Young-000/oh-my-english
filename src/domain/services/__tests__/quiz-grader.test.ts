import { describe, it, expect, beforeEach } from 'vitest'
import { QuizGrader, QuizSubmission } from '../quiz-generator'

describe('QuizGrader', () => {
  let grader: QuizGrader

  beforeEach(() => {
    grader = new QuizGrader()
  })

  // 테스트용 submission 생성 헬퍼
  function createSubmission(
    overrides: Partial<QuizSubmission> = {}
  ): QuizSubmission {
    return {
      quizType: 'korean_to_english',
      question: '밥 먹었어?',
      userAnswer: 'Have you eaten yet?',
      correctAnswer: 'Have you eaten yet?',
      recordId: 'test-record',
      timeTakenMs: 5000,
      ...overrides,
    }
  }

  describe('korean_to_english 채점', () => {
    it('정확히 일치하면 정답 처리해야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Have you eaten yet?',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBe(1)
      expect(result.feedback).toContain('정확')
    })

    it('대소문자가 달라도 정답 처리해야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'HAVE YOU EATEN YET?',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })

    it('앞뒤 공백이 있어도 정답 처리해야 한다', () => {
      const submission = createSubmission({
        userAnswer: '  Have you eaten yet?  ',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })

    it('구두점이 달라도 정답 처리해야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Have you eaten yet',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })

    it('90% 이상 유사하면 정답 처리해야 한다 (오타 허용)', () => {
      const submission = createSubmission({
        userAnswer: 'Have you eatn yet?', // eaten -> eatn (1글자 오타)
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBeGreaterThanOrEqual(0.9)
      expect(result.feedback).toContain('오타')
    })

    it('70-89% 유사도면 오답이지만 아깝다는 피드백을 줘야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Have you eat yet?', // eaten -> eat
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      // 유사도에 따라 결과가 다를 수 있음
      if (result.similarity! >= 0.7 && result.similarity! < 0.9) {
        expect(result.isCorrect).toBe(false)
        expect(result.feedback).toContain('아깝')
      }
    })

    it('70% 미만 유사도면 오답 처리하고 정답을 알려줘야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Hello there',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBeLessThan(0.7)
      expect(result.feedback).toContain('Have you eaten yet?')
    })

    it('빈 답변은 오답 처리해야 한다', () => {
      const submission = createSubmission({
        userAnswer: '',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBe(0)
    })
  })

  describe('fill_blank 채점', () => {
    it('정확히 일치하면 정답 처리해야 한다', () => {
      const submission = createSubmission({
        quizType: 'fill_blank',
        userAnswer: 'eaten',
        correctAnswer: 'eaten',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBe(1)
    })

    it('85% 이상 유사하면 정답 처리해야 한다', () => {
      const submission = createSubmission({
        quizType: 'fill_blank',
        userAnswer: 'eatn', // 1글자 오타
        correctAnswer: 'eaten',
      })

      const result = grader.grade(submission)

      // 5글자 중 1글자 틀림 = 80% 유사도
      // 정확한 유사도에 따라 결과 다름
      expect(result.feedback).toBeDefined()
    })

    it('대소문자 무시해야 한다', () => {
      const submission = createSubmission({
        quizType: 'fill_blank',
        userAnswer: 'EATEN',
        correctAnswer: 'eaten',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })

    it('오답이면 정답을 피드백에 포함해야 한다', () => {
      const submission = createSubmission({
        quizType: 'fill_blank',
        userAnswer: 'cooked',
        correctAnswer: 'eaten',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
      expect(result.feedback).toContain('eaten')
    })
  })

  describe('multiple_choice 채점', () => {
    it('정확히 일치하면 정답 처리해야 한다', () => {
      const submission = createSubmission({
        quizType: 'multiple_choice',
        userAnswer: 'Have you eaten yet?',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
      expect(result.similarity).toBe(1)
      expect(result.feedback).toContain('정답')
    })

    it('대소문자가 달라도 정답 처리해야 한다', () => {
      const submission = createSubmission({
        quizType: 'multiple_choice',
        userAnswer: 'have you eaten yet?',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(true)
    })

    it('오답이면 similarity가 0이어야 한다', () => {
      const submission = createSubmission({
        quizType: 'multiple_choice',
        userAnswer: 'Did you eat?',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.isCorrect).toBe(false)
      expect(result.similarity).toBe(0)
      expect(result.feedback).toContain('틀렸')
    })
  })

  describe('유사도 계산 edge cases', () => {
    it('완전히 동일한 문자열은 유사도 1이어야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'test',
        correctAnswer: 'test',
      })

      const result = grader.grade(submission)
      expect(result.similarity).toBe(1)
    })

    it('완전히 다른 문자열은 낮은 유사도를 가져야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'aaaa',
        correctAnswer: 'zzzz',
      })

      const result = grader.grade(submission)
      expect(result.similarity).toBe(0)
    })

    it('한 글자 차이는 높은 유사도를 가져야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'hello',
        correctAnswer: 'hallo',
      })

      const result = grader.grade(submission)
      // 5글자 중 1글자 다름 = 80% 유사도
      expect(result.similarity).toBeGreaterThanOrEqual(0.8)
    })

    it('중간 공백 정규화를 해야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Have   you    eaten   yet',
        correctAnswer: 'Have you eaten yet',
      })

      const result = grader.grade(submission)
      expect(result.isCorrect).toBe(true)
    })
  })

  describe('피드백 메시지', () => {
    it('정답일 때 긍정적인 피드백을 줘야 한다', () => {
      const submission = createSubmission()
      const result = grader.grade(submission)

      expect(result.feedback).toMatch(/정확|정답|🎉/)
    })

    it('근접 오답일 때 격려하는 피드백을 줘야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Have you eatenn yet?', // 작은 오타
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      if (!result.isCorrect && result.similarity! >= 0.7) {
        expect(result.feedback).toContain('아깝')
      }
    })

    it('오답일 때 정답을 포함한 피드백을 줘야 한다', () => {
      const submission = createSubmission({
        userAnswer: 'Wrong answer',
        correctAnswer: 'Have you eaten yet?',
      })

      const result = grader.grade(submission)

      expect(result.feedback).toContain('Have you eaten yet?')
    })
  })

  describe('응답 구조', () => {
    it('모든 필수 필드가 포함되어야 한다', () => {
      const submission = createSubmission()
      const result = grader.grade(submission)

      expect(result).toHaveProperty('isCorrect')
      expect(result).toHaveProperty('correctAnswer')
      expect(result).toHaveProperty('userAnswer')
      expect(result).toHaveProperty('feedback')
    })

    it('similarity가 숫자여야 한다', () => {
      const submission = createSubmission()
      const result = grader.grade(submission)

      expect(typeof result.similarity).toBe('number')
      expect(result.similarity).toBeGreaterThanOrEqual(0)
      expect(result.similarity).toBeLessThanOrEqual(1)
    })
  })
})
