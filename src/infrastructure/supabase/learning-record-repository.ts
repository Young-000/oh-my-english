/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ILearningRecordRepository,
  CreateLearningRecordInput,
  LearningRecordFilters,
  LearningRecordWithCount,
} from '@/domain/repositories/learning-record-repository'
import type { LearningRecord } from '@/domain/entities/translation'
import type { Database } from './types'
import { calculateNextReview } from '@/lib/spaced-repetition'

type LearningRecordRow = Database['oh_my_english']['Tables']['learning_records']['Row']

const SCHEMA = 'oh_my_english'

export class SupabaseLearningRecordRepository implements ILearningRecordRepository {
  constructor(private readonly supabase: any) {}

  async create(input: CreateLearningRecordInput): Promise<LearningRecord> {
    const { data, error } = await this.supabase
      .schema(SCHEMA)
      .from('learning_records')
      .insert({
        user_id: input.userId,
        korean_input: input.koreanInput,
        english_expression: input.translationResult.mainExpression.english,
        context_explanation: input.translationResult.explanation.context,
        alternatives: input.translationResult.alternatives,
        related_vocabulary: input.translationResult.relatedVocabulary,
        category: input.translationResult.category,
      })
      .select()
      .single()

    if (error) throw error
    return this.mapToEntity(data as LearningRecordRow)
  }

  async findById(id: string): Promise<LearningRecord | null> {
    const { data, error } = await this.supabase
      .schema(SCHEMA)
      .from('learning_records')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return this.mapToEntity(data as LearningRecordRow)
  }

  async findByUserId(filters: LearningRecordFilters): Promise<LearningRecord[]> {
    let query = this.supabase
      .schema(SCHEMA)
      .from('learning_records')
      .select()
      .eq('user_id', filters.userId)
      .order('created_at', { ascending: false })

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.isBookmarked !== undefined) {
      query = query.eq('is_bookmarked', filters.isBookmarked)
    }

    if (filters.masteryLevel !== undefined) {
      query = query.eq('mastery_level', filters.masteryLevel)
    }

    if (filters.searchQuery) {
      query = query.or(
        `korean_input.ilike.%${filters.searchQuery}%,english_expression.ilike.%${filters.searchQuery}%`
      )
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return ((data ?? []) as LearningRecordRow[]).map(this.mapToEntity)
  }

  async findByUserIdWithCount(filters: LearningRecordFilters): Promise<LearningRecordWithCount> {
    let query = this.supabase
      .schema(SCHEMA)
      .from('learning_records')
      .select('*', { count: 'exact' })
      .eq('user_id', filters.userId)
      .order('created_at', { ascending: false })

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.isBookmarked !== undefined) {
      query = query.eq('is_bookmarked', filters.isBookmarked)
    }

    if (filters.masteryLevel !== undefined) {
      query = query.eq('mastery_level', filters.masteryLevel)
    }

    if (filters.searchQuery) {
      query = query.or(
        `korean_input.ilike.%${filters.searchQuery}%,english_expression.ilike.%${filters.searchQuery}%`
      )
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    const limit = filters.limit || 10
    const offset = filters.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error
    return {
      records: ((data ?? []) as LearningRecordRow[]).map(this.mapToEntity),
      total: count ?? 0,
    }
  }

  async findDueForReview(userId: string, limit = 10): Promise<LearningRecord[]> {
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .schema(SCHEMA)
      .from('learning_records')
      .select()
      .eq('user_id', userId)
      .or(`next_review_at.lte.${now},mastery_level.lt.3`)
      .order('next_review_at', { ascending: true, nullsFirst: true })
      .limit(limit)

    if (error) throw error
    return ((data ?? []) as LearningRecordRow[]).map(this.mapToEntity)
  }

  async update(id: string, data: Partial<LearningRecord>): Promise<LearningRecord> {
    const updateData: Record<string, unknown> = {}

    if (data.isBookmarked !== undefined) updateData.is_bookmarked = data.isBookmarked
    if (data.masteryLevel !== undefined) updateData.mastery_level = data.masteryLevel
    if (data.reviewCount !== undefined) updateData.review_count = data.reviewCount
    if (data.nextReviewAt !== undefined)
      updateData.next_review_at = data.nextReviewAt?.toISOString() ?? null

    const { data: updated, error } = await this.supabase
      .schema(SCHEMA)
      .from('learning_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.mapToEntity(updated as LearningRecordRow)
  }

  async updateMasteryLevel(id: string, isCorrect: boolean): Promise<LearningRecord> {
    const record = await this.findById(id)
    if (!record) throw new Error('Record not found')

    const newMasteryLevel = isCorrect
      ? Math.min(record.masteryLevel + 1, 5)
      : Math.max(record.masteryLevel - 1, 0)

    const nextReviewAt = calculateNextReview(newMasteryLevel)

    return this.update(id, {
      masteryLevel: newMasteryLevel,
      reviewCount: record.reviewCount + 1,
      nextReviewAt,
    })
  }

  async toggleBookmark(id: string): Promise<LearningRecord> {
    const record = await this.findById(id)
    if (!record) throw new Error('Record not found')

    return this.update(id, { isBookmarked: !record.isBookmarked })
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.schema(SCHEMA)
      .from('learning_records').delete().eq('id', id)
    if (error) throw error
  }

  private mapToEntity(row: Database['oh_my_english']['Tables']['learning_records']['Row']): LearningRecord {
    return {
      id: row.id,
      userId: row.user_id,
      koreanInput: row.korean_input,
      englishExpression: row.english_expression,
      contextExplanation: row.context_explanation ?? '',
      alternatives: row.alternatives ?? [],
      relatedVocabulary: row.related_vocabulary ?? [],
      category: row.category,
      isBookmarked: row.is_bookmarked,
      masteryLevel: row.mastery_level,
      reviewCount: row.review_count,
      nextReviewAt: row.next_review_at ? new Date(row.next_review_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }
}
