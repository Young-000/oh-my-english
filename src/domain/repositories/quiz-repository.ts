import type { QuizAttempt } from '../entities/translation'

export interface CreateQuizAttemptInput {
  userId: string
  recordId: string
  quizType: QuizAttempt['quizType']
  question: string
  userAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  timeTakenMs: number | null
}

export interface QuizAttemptFilters {
  userId: string
  recordId?: string
  quizType?: QuizAttempt['quizType']
  isCorrect?: boolean
  limit?: number
  offset?: number
}

export interface QuizStats {
  totalAttempts: number
  correctCount: number
  incorrectCount: number
  averageTimeMs: number
  accuracyRate: number
}

export interface IQuizAttemptRepository {
  create(input: CreateQuizAttemptInput): Promise<QuizAttempt>
  findById(id: string): Promise<QuizAttempt | null>
  findByUserId(filters: QuizAttemptFilters): Promise<QuizAttempt[]>
  findByRecordId(recordId: string): Promise<QuizAttempt[]>
  getStats(userId: string): Promise<QuizStats>
  getStatsForRecord(recordId: string): Promise<QuizStats>
  delete(id: string): Promise<void>
}
