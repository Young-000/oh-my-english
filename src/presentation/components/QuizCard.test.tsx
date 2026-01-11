import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuizCard } from './QuizCard'
import type { Quiz, QuizResult } from '@/domain/services/quiz-generator'

// Happy-dom에서 matchMedia 모킹
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('QuizCard', () => {
  const mockOnSubmit = vi.fn()
  const mockOnNext = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Korean to English quiz', () => {
    const quiz: Quiz = {
      type: 'korean_to_english',
      question: '밥 뭐 먹을래?',
      correctAnswer: 'What do you want to eat?',
      recordId: 'record-1',
      hint: 'What...',
    }

    it('should render question correctly', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      expect(screen.getByText('밥 뭐 먹을래?')).toBeInTheDocument()
      expect(screen.getByText('이 표현을 영어로 번역하세요')).toBeInTheDocument()
    })

    it('should render input field', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', '영어로 입력하세요...')
    })

    it('should show hint when hint button is clicked', async () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const hintButton = screen.getByRole('button', { name: /힌트/i })
      fireEvent.click(hintButton)

      await waitFor(() => {
        expect(screen.getByText(/What/)).toBeInTheDocument()
      })
    })

    it('should submit answer and show result', async () => {
      const mockResult: QuizResult = {
        isCorrect: true,
        correctAnswer: quiz.correctAnswer,
        userAnswer: 'What do you want to eat?',
        similarity: 1,
        feedback: '🎉 정답입니다!',
      }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      fireEvent.change(input, { target: { value: 'What do you want to eat?' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('quiz-result')).toBeInTheDocument()
        expect(screen.getByText(/정답입니다/)).toBeInTheDocument()
      })
    })

    it('should show next button after submission', async () => {
      const mockResult: QuizResult = {
        isCorrect: true,
        correctAnswer: quiz.correctAnswer,
        userAnswer: 'What do you want to eat?',
        similarity: 1,
        feedback: '🎉 정답입니다!',
      }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      fireEvent.change(input, { target: { value: 'What do you want to eat?' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      })
    })

    it('should call onNext when next button is clicked', async () => {
      const mockResult: QuizResult = {
        isCorrect: true,
        correctAnswer: quiz.correctAnswer,
        userAnswer: 'What do you want to eat?',
        similarity: 1,
        feedback: '🎉 정답입니다!',
      }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      fireEvent.change(input, { target: { value: 'What do you want to eat?' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        const nextButton = screen.getByTestId('next-button')
        fireEvent.click(nextButton)
      })

      expect(mockOnNext).toHaveBeenCalled()
    })
  })

  describe('Fill in the blank quiz', () => {
    const quiz: Quiz = {
      type: 'fill_blank',
      question: '밥 뭐 먹을래?\n\n"What do you _____ to eat?"',
      correctAnswer: 'want',
      recordId: 'record-1',
    }

    it('should render fill blank question', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      expect(screen.getByText(/What do you _____ to eat/)).toBeInTheDocument()
      expect(screen.getByText('빈칸에 들어갈 단어를 입력하세요')).toBeInTheDocument()
    })

    it('should show correct result for fill blank', async () => {
      const mockResult: QuizResult = {
        isCorrect: true,
        correctAnswer: quiz.correctAnswer,
        userAnswer: 'What do you want to eat?',
        similarity: 1,
        feedback: '🎉 정답입니다!',
      }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      fireEvent.change(input, { target: { value: 'want' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/정답입니다/)).toBeInTheDocument()
      })
    })
  })

  describe('Multiple choice quiz', () => {
    const quiz: Quiz = {
      type: 'multiple_choice',
      question: '밥 뭐 먹을래?',
      correctAnswer: 'What do you want to eat?',
      recordId: 'record-1',
      options: [
        'What do you want to eat?',
        'How are you?',
        'Where are you going?',
        'What time is it?',
      ],
    }

    it('should render multiple choice options', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      expect(screen.getByText('올바른 영어 표현을 선택하세요')).toBeInTheDocument()
      expect(screen.getByTestId('quiz-option-0')).toBeInTheDocument()
      expect(screen.getByTestId('quiz-option-1')).toBeInTheDocument()
      expect(screen.getByTestId('quiz-option-2')).toBeInTheDocument()
      expect(screen.getByTestId('quiz-option-3')).toBeInTheDocument()
    })

    it('should allow selecting an option', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const option = screen.getByTestId('quiz-option-0')
      fireEvent.click(option)

      // 선택된 옵션은 다른 스타일을 가져야 함
      expect(option).toHaveAttribute('data-variant', 'default')
    })

    it('should show correct/incorrect styling after submission', async () => {
      const mockResult: QuizResult = {
        isCorrect: true,
        correctAnswer: quiz.correctAnswer,
        userAnswer: 'What do you want to eat?',
        similarity: 1,
        feedback: '🎉 정답입니다!',
      }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const option = screen.getByTestId('quiz-option-0')
      fireEvent.click(option)

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/정답입니다/)).toBeInTheDocument()
      })
    })
  })

  describe('Timer', () => {
    it('should display timer', () => {
      const quiz: Quiz = {
        type: 'korean_to_english',
        question: '테스트',
        correctAnswer: 'test',
        recordId: 'record-1',
      }

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const timer = screen.getByTestId('quiz-timer')
      expect(timer).toBeInTheDocument()
      expect(timer).toHaveTextContent('0:00')
    })
  })

  describe('Incorrect answer handling', () => {
    const quiz: Quiz = {
      type: 'korean_to_english',
      question: '밥 뭐 먹을래?',
      correctAnswer: 'What do you want to eat?',
      recordId: 'record-1',
    }

    it('should show correct answer when wrong', async () => {
      const mockResult: QuizResult = {
        isCorrect: false,
        correctAnswer: quiz.correctAnswer,
        userAnswer: 'Hello world',
        similarity: 0.3,
        feedback: '아쉽네요. 정답을 확인해보세요.',
      }
      mockOnSubmit.mockResolvedValue(mockResult)

      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      fireEvent.change(input, { target: { value: 'Hello world' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/아쉽네요/)).toBeInTheDocument()
        expect(screen.getByText('What do you want to eat?')).toBeInTheDocument()
      })
    })
  })

  describe('Submit button state', () => {
    const quiz: Quiz = {
      type: 'korean_to_english',
      question: '테스트',
      correctAnswer: 'test',
      recordId: 'record-1',
    }

    it('should disable submit button when input is empty', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when input has value', () => {
      render(<QuizCard quiz={quiz} onSubmit={mockOnSubmit} onNext={mockOnNext} />)

      const input = screen.getByTestId('quiz-input')
      fireEvent.change(input, { target: { value: 'test' } })

      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).not.toBeDisabled()
    })
  })
})
