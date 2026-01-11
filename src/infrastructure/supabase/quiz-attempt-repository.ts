/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  IQuizAttemptRepository,
  CreateQuizAttemptInput,
  QuizAttemptFilters,
  QuizStats,
} from '@/domain/repositories/quiz-repository'
import type { QuizAttempt } from '@/domain/entities/translation'
import type { Database } from './types'

type QuizAttemptRow = Database['oh_my_english']['Tables']['quiz_attempts']['Row']

const SCHEMA = 'oh_my_english'

export class SupabaseQuizAttemptRepository implements IQuizAttemptRepository {
  constructor(private readonly supabase: any) {}

  private get table() {
    return this.supabase.schema(SCHEMA).from('quiz_attempts')
  }

  async create(input: CreateQuizAttemptInput): Promise<QuizAttempt> {
    const { data, error } = await this.table
      .insert({
        user_id: input.userId,
        record_id: input.recordId,
        quiz_type: input.quizType,
        question: input.question,
        user_answer: input.userAnswer,
        correct_answer: input.correctAnswer,
        is_correct: input.isCorrect,
        time_taken_ms: input.timeTakenMs,
      })
      .select()
      .single()

    if (error) throw error
    return this.mapToEntity(data as QuizAttemptRow)
  }

  async findById(id: string): Promise<QuizAttempt | null> {
    const { data, error } = await this.table
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return this.mapToEntity(data as QuizAttemptRow)
  }

  async findByUserId(filters: QuizAttemptFilters): Promise<QuizAttempt[]> {
    let query = this.table
      .select()
      .eq('user_id', filters.userId)
      .order('created_at', { ascending: false })

    if (filters.recordId) {
      query = query.eq('record_id', filters.recordId)
    }

    if (filters.quizType) {
      query = query.eq('quiz_type', filters.quizType)
    }

    if (filters.isCorrect !== undefined) {
      query = query.eq('is_correct', filters.isCorrect)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return ((data ?? []) as QuizAttemptRow[]).map(this.mapToEntity)
  }

  async findByRecordId(recordId: string): Promise<QuizAttempt[]> {
    const { data, error } = await this.table
      .select()
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as QuizAttemptRow[]).map(this.mapToEntity)
  }

  async getStats(userId: string): Promise<QuizStats> {
    const { data, error } = await this.table
      .select('is_correct, time_taken_ms')
      .eq('user_id', userId)

    if (error) throw error

    const attempts = data ?? []
    const totalAttempts = attempts.length
    const correctCount = attempts.filter((a: { is_correct: boolean }) => a.is_correct).length
    const incorrectCount = totalAttempts - correctCount

    const timesWithValues = attempts
      .map((a: { time_taken_ms: number | null }) => a.time_taken_ms)
      .filter((t: number | null): t is number => t !== null)

    const averageTimeMs =
      timesWithValues.length > 0
        ? timesWithValues.reduce((sum: number, t: number) => sum + t, 0) / timesWithValues.length
        : 0

    return {
      totalAttempts,
      correctCount,
      incorrectCount,
      averageTimeMs: Math.round(averageTimeMs),
      accuracyRate: totalAttempts > 0 ? correctCount / totalAttempts : 0,
    }
  }

  async getStatsForRecord(recordId: string): Promise<QuizStats> {
    const { data, error } = await this.table
      .select('is_correct, time_taken_ms')
      .eq('record_id', recordId)

    if (error) throw error

    const attempts = data ?? []
    const totalAttempts = attempts.length
    const correctCount = attempts.filter((a: { is_correct: boolean }) => a.is_correct).length
    const incorrectCount = totalAttempts - correctCount

    const timesWithValues = attempts
      .map((a: { time_taken_ms: number | null }) => a.time_taken_ms)
      .filter((t: number | null): t is number => t !== null)

    const averageTimeMs =
      timesWithValues.length > 0
        ? timesWithValues.reduce((sum: number, t: number) => sum + t, 0) / timesWithValues.length
        : 0

    return {
      totalAttempts,
      correctCount,
      incorrectCount,
      averageTimeMs: Math.round(averageTimeMs),
      accuracyRate: totalAttempts > 0 ? correctCount / totalAttempts : 0,
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table.delete().eq('id', id)
    if (error) throw error
  }

  private mapToEntity(row: QuizAttemptRow): QuizAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      recordId: row.record_id,
      quizType: row.quiz_type,
      question: row.question,
      userAnswer: row.user_answer ?? '',
      correctAnswer: row.correct_answer,
      isCorrect: row.is_correct,
      timeTakenMs: row.time_taken_ms ?? 0,
      createdAt: new Date(row.created_at),
    }
  }
}
