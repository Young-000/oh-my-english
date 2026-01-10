import type { LearningRecord, TranslationResult } from '../entities/translation'

export interface CreateLearningRecordInput {
  userId: string
  koreanInput: string
  translationResult: TranslationResult
}

export interface LearningRecordFilters {
  userId: string
  category?: string
  isBookmarked?: boolean
  masteryLevel?: number
  searchQuery?: string
  limit?: number
  offset?: number
}

export interface ILearningRecordRepository {
  create(input: CreateLearningRecordInput): Promise<LearningRecord>
  findById(id: string): Promise<LearningRecord | null>
  findByUserId(filters: LearningRecordFilters): Promise<LearningRecord[]>
  findDueForReview(userId: string, limit?: number): Promise<LearningRecord[]>
  update(id: string, data: Partial<LearningRecord>): Promise<LearningRecord>
  updateMasteryLevel(id: string, isCorrect: boolean): Promise<LearningRecord>
  toggleBookmark(id: string): Promise<LearningRecord>
  delete(id: string): Promise<void>
}
