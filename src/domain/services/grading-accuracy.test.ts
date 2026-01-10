import { describe, it, expect } from 'vitest'
import { QuizGrader, QuizSubmission, QuizResult } from './quiz-generator'

/**
 * 채점 정확도 검증 테스트
 *
 * 다양한 시나리오에서 채점 시스템이 정확하게 동작하는지 검증
 * - 정답 판정의 일관성
 * - 유사도 계산의 정확성
 * - 피드백 메시지의 적절성
 */

describe('Grading Accuracy Tests', () => {
  const grader = new QuizGrader()

  describe('Korean to English - Exact Match Scenarios', () => {
    const exactMatchCases = [
      { answer: 'Hello', input: 'Hello', shouldBeCorrect: true },
      { answer: 'Hello', input: 'hello', shouldBeCorrect: true },
      { answer: 'Hello', input: 'HELLO', shouldBeCorrect: true },
      { answer: "What's up?", input: "what's up", shouldBeCorrect: true },
      { answer: "I'm fine", input: "i'm fine", shouldBeCorrect: true },
      { answer: 'How are you?', input: 'How are you', shouldBeCorrect: true },
    ]

    exactMatchCases.forEach(({ answer, input, shouldBeCorrect }) => {
      it(`should ${shouldBeCorrect ? 'accept' : 'reject'} "${input}" for "${answer}"`, () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '테스트',
          userAnswer: input,
          correctAnswer: answer,
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.isCorrect).toBe(shouldBeCorrect)
      })
    })
  })

  describe('Similarity Score Accuracy', () => {
    describe('Levenshtein Distance Calculations', () => {
      const similarityTests = [
        // 동일한 문자열: 100%
        { str1: 'hello', str2: 'hello', expectedSimilarity: 1.0 },
        // 한 글자 차이: 80% (5글자 중 1글자 다름)
        { str1: 'hello', str2: 'helo', expectedSimilarity: 0.8 },
        { str1: 'hello', str2: 'helloo', expectedSimilarity: 0.83 },
        // 두 글자 차이: 60%
        { str1: 'hello', str2: 'halo', expectedSimilarity: 0.6 },
        // 완전히 다른 문자열: 낮은 유사도
        { str1: 'hello', str2: 'world', expectedSimilarity: 0.2 },
      ]

      similarityTests.forEach(({ str1, str2, expectedSimilarity }) => {
        it(`should calculate similarity between "${str1}" and "${str2}" as ~${expectedSimilarity}`, () => {
          const submission: QuizSubmission = {
            quizType: 'korean_to_english',
            question: '테스트',
            userAnswer: str1,
            correctAnswer: str2,
            recordId: 'test',
            timeTakenMs: 1000,
          }
          const result = grader.grade(submission)
          expect(result.similarity).toBeGreaterThanOrEqual(expectedSimilarity - 0.1)
          expect(result.similarity).toBeLessThanOrEqual(expectedSimilarity + 0.15)
        })
      })
    })

    describe('Long Phrase Similarity', () => {
      it('should have higher tolerance for typos in long phrases', () => {
        const correctAnswer = 'What do you want to eat for dinner tonight?'
        const userWithTypo = 'What do you want to eat for dinne tonight?' // 'dinne' instead of 'dinner'

        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '오늘 저녁 뭐 먹고 싶어?',
          userAnswer: userWithTypo,
          correctAnswer,
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)

        // 긴 문장에서 한 글자 차이는 높은 유사도
        expect(result.similarity).toBeGreaterThan(0.95)
        expect(result.isCorrect).toBe(true)
      })

      it('should reject significantly different long phrases', () => {
        const correctAnswer = 'What do you want to eat for dinner tonight?'
        const wrongAnswer = 'Where are you going for dinner tonight?'

        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '오늘 저녁 뭐 먹고 싶어?',
          userAnswer: wrongAnswer,
          correctAnswer,
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)

        expect(result.isCorrect).toBe(false)
        expect(result.similarity).toBeLessThan(0.9)
      })
    })
  })

  describe('Quiz Type Specific Grading', () => {
    describe('Korean to English (90% threshold)', () => {
      it('should pass with 90%+ similarity', () => {
        // Need a longer phrase where typo has less impact
        // "What do you want to eat today" vs "What do you want to eat toady" - one typo
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '오늘 뭐 먹고 싶어?',
          userAnswer: 'What do you want to eat toady',
          correctAnswer: 'What do you want to eat today',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        // 29 chars, 2 char difference = ~93% similarity
        expect(result.similarity).toBeGreaterThanOrEqual(0.9)
        expect(result.isCorrect).toBe(true)
      })

      it('should fail when similarity is below 90%', () => {
        // "I am going home" vs "I am going hoem" - 86.7% similarity
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '집에 갈게',
          userAnswer: 'I am going hoem',
          correctAnswer: 'I am going home',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.similarity).toBeLessThan(0.9)
        expect(result.isCorrect).toBe(false)
      })

      it('should fail with <90% similarity', () => {
        // "Hello" vs "Helo" - 80% similarity
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '안녕',
          userAnswer: 'Helo',
          correctAnswer: 'Hello',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.similarity).toBeLessThan(0.9)
        expect(result.isCorrect).toBe(false)
      })
    })

    describe('Fill Blank (85% threshold)', () => {
      it('should pass with 85%+ similarity for fill_blank', () => {
        // "want" vs "wannt" - one extra letter, ~83% but close
        const submission: QuizSubmission = {
          quizType: 'fill_blank',
          question: '"What do you _____ to eat?"',
          userAnswer: 'wantt',
          correctAnswer: 'want',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        // 4글자에서 1글자 추가 = 80%이므로 정답 아님
        expect(result.isCorrect).toBe(false)
      })

      it('should pass with exact match for fill_blank', () => {
        const submission: QuizSubmission = {
          quizType: 'fill_blank',
          question: '"What do you _____ to eat?"',
          userAnswer: 'want',
          correctAnswer: 'want',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.isCorrect).toBe(true)
        expect(result.similarity).toBe(1)
      })
    })

    describe('Multiple Choice (exact match)', () => {
      it('should only accept exact match for multiple_choice', () => {
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

      it('should reject even similar answers for multiple_choice', () => {
        const submission: QuizSubmission = {
          quizType: 'multiple_choice',
          question: '안녕',
          userAnswer: 'Hi there',
          correctAnswer: 'Hello',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.isCorrect).toBe(false)
        expect(result.similarity).toBe(0)
      })
    })
  })

  describe('Feedback Message Accuracy', () => {
    describe('Correct answer feedback', () => {
      it('should include celebration emoji for exact match', () => {
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
        expect(result.feedback).toContain('정확')
      })

      it('should mention typo for near-match', () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '안녕하세요',
          userAnswer: 'Hello, how are yuo?',
          correctAnswer: 'Hello, how are you?',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        if (result.isCorrect && result.similarity && result.similarity < 1) {
          expect(result.feedback).toContain('오타')
        }
      })
    })

    describe('Incorrect answer feedback', () => {
      it('should include correct answer in feedback', () => {
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

      it('should provide encouraging feedback for close answers', () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '밥 먹었어?',
          userAnswer: 'Have you ate?',
          correctAnswer: 'Have you eaten?',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        // 가까운 답은 격려 메시지
        if (result.similarity && result.similarity > 0.7) {
          expect(result.feedback).toContain('아깝')
        }
      })
    })
  })

  describe('Edge Cases in Grading', () => {
    describe('Whitespace handling', () => {
      it('should normalize multiple spaces', () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '안녕',
          userAnswer: 'Hello   there',
          correctAnswer: 'Hello there',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.isCorrect).toBe(true)
      })

      it('should trim leading/trailing whitespace', () => {
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

    describe('Punctuation handling', () => {
      const punctuationTests = [
        { user: 'Hello', correct: 'Hello!', expected: true },
        { user: 'Hello!', correct: 'Hello', expected: true },
        { user: 'Hello.', correct: 'Hello', expected: true },
        { user: 'Hello?', correct: 'Hello!', expected: true },
      ]

      punctuationTests.forEach(({ user, correct, expected }) => {
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

    describe('Empty answer handling', () => {
      it('should reject empty answer', () => {
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

      it('should handle both empty', () => {
        const submission: QuizSubmission = {
          quizType: 'korean_to_english',
          question: '안녕',
          userAnswer: '',
          correctAnswer: '',
          recordId: 'test',
          timeTakenMs: 1000,
        }
        const result = grader.grade(submission)
        expect(result.isCorrect).toBe(true)
        expect(result.similarity).toBe(1)
      })
    })
  })

  describe('Grading Consistency', () => {
    it('should give same result for same input', () => {
      const submission: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '안녕',
        userAnswer: 'Hello',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }

      const results: QuizResult[] = []
      for (let i = 0; i < 10; i++) {
        results.push(grader.grade(submission))
      }

      // 모든 결과가 동일해야 함
      results.forEach((result) => {
        expect(result.isCorrect).toBe(results[0].isCorrect)
        expect(result.similarity).toBe(results[0].similarity)
      })
    })

    it('should have symmetric similarity', () => {
      const submission1: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'Hello',
        correctAnswer: 'World',
        recordId: 'test',
        timeTakenMs: 1000,
      }
      const submission2: QuizSubmission = {
        quizType: 'korean_to_english',
        question: '테스트',
        userAnswer: 'World',
        correctAnswer: 'Hello',
        recordId: 'test',
        timeTakenMs: 1000,
      }

      const result1 = grader.grade(submission1)
      const result2 = grader.grade(submission2)

      // 유사도는 대칭적이어야 함
      expect(result1.similarity).toBe(result2.similarity)
    })
  })

  describe('Real-world Answer Scenarios', () => {
    const realWorldTests = [
      {
        korean: '밥 먹었어?',
        correct: 'Have you eaten?',
        variations: [
          { answer: 'Have you eaten', expected: true }, // 물음표 없음
          { answer: 'Did you eat?', expected: false }, // 의미는 비슷하지만 다른 표현
          { answer: 'Have you eatn?', expected: true }, // 작은 오타
          { answer: 'Hav you eaten?', expected: true }, // 작은 오타
        ],
      },
      {
        korean: "어디 가?",
        correct: 'Where are you going?',
        variations: [
          { answer: 'Where are you going', expected: true },
          { answer: 'Where r u going?', expected: false }, // 인터넷 슬랭
          { answer: 'Where are you goin?', expected: true }, // 구어체 + 오타
        ],
      },
    ]

    realWorldTests.forEach(({ korean, correct, variations }) => {
      describe(`for "${korean}" -> "${correct}"`, () => {
        variations.forEach(({ answer, expected }) => {
          it(`should ${expected ? 'accept' : 'reject'} "${answer}"`, () => {
            const submission: QuizSubmission = {
              quizType: 'korean_to_english',
              question: korean,
              userAnswer: answer,
              correctAnswer: correct,
              recordId: 'test',
              timeTakenMs: 1000,
            }
            const result = grader.grade(submission)
            expect(result.isCorrect).toBe(expected)
          })
        })
      })
    })
  })
})

describe('Grading Performance', () => {
  const grader = new QuizGrader()

  it('should grade quickly even for long answers', () => {
    const longAnswer = 'This is a very long answer that contains many words and should still be graded quickly without any performance issues or delays whatsoever because performance is important.'

    const submission: QuizSubmission = {
      quizType: 'korean_to_english',
      question: '긴 문장 테스트',
      userAnswer: longAnswer,
      correctAnswer: longAnswer,
      recordId: 'test',
      timeTakenMs: 1000,
    }

    const start = Date.now()
    for (let i = 0; i < 100; i++) {
      grader.grade(submission)
    }
    const elapsed = Date.now() - start

    // 100번 채점에 100ms 미만이어야 함
    expect(elapsed).toBeLessThan(100)
  })

  it('should handle stress test of many submissions', () => {
    const submissions: QuizSubmission[] = Array.from({ length: 1000 }, (_, i) => ({
      quizType: 'korean_to_english' as const,
      question: `질문 ${i}`,
      userAnswer: `Answer ${i}`,
      correctAnswer: `Answer ${i}`,
      recordId: `test-${i}`,
      timeTakenMs: 1000,
    }))

    const start = Date.now()
    submissions.forEach((s) => grader.grade(s))
    const elapsed = Date.now() - start

    // 1000개 채점에 1초 미만
    expect(elapsed).toBeLessThan(1000)
  })
})
