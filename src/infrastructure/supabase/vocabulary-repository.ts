import { createServerSupabaseClient } from './server'
import type { Database } from './types'

const SCHEMA = 'oh_my_english'

type VocabularyBook = Database['oh_my_english']['Tables']['vocabulary_books']['Row']
type VocabularyBookInsert = Database['oh_my_english']['Tables']['vocabulary_books']['Insert']
type VocabularyItem = Database['oh_my_english']['Tables']['vocabulary_items']['Row']
type VocabularyItemInsert = Database['oh_my_english']['Tables']['vocabulary_items']['Insert']
type VocabularyProgress = Database['oh_my_english']['Tables']['vocabulary_progress']['Row']
type VocabularyProgressInsert = Database['oh_my_english']['Tables']['vocabulary_progress']['Insert']

export interface VocabularyBookWithItems extends VocabularyBook {
  items?: VocabularyItem[]
}

export interface VocabularyItemWithProgress extends VocabularyItem {
  progress?: VocabularyProgress | null
}

export class VocabularyRepository {
  private async getClient() {
    return await createServerSupabaseClient()
  }

  // =====================================================
  // 단어장 (Books) 관련 메서드
  // =====================================================

  /**
   * 시스템 기본 단어장 목록 조회
   */
  async getSystemBooks(): Promise<VocabularyBook[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .select('*')
      .eq('is_system', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching system books:', error)
      return []
    }

    return data || []
  }

  /**
   * 공개 단어장 목록 조회
   */
  async getPublicBooks(): Promise<VocabularyBook[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .select('*')
      .eq('is_public', true)
      .eq('is_system', false)
      .order('expression_count', { ascending: false })

    if (error) {
      console.error('Error fetching public books:', error)
      return []
    }

    return data || []
  }

  /**
   * 사용자 단어장 목록 조회
   */
  async getUserBooks(userId: string): Promise<VocabularyBook[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user books:', error)
      return []
    }

    return data || []
  }

  /**
   * 모든 접근 가능한 단어장 조회 (시스템 + 공개 + 본인 것)
   */
  async getAccessibleBooks(userId?: string): Promise<VocabularyBook[]> {
    const supabase = await this.getClient()
    let query = supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .select('*')

    if (userId) {
      query = query.or(`is_system.eq.true,is_public.eq.true,user_id.eq.${userId}`)
    } else {
      query = query.or('is_system.eq.true,is_public.eq.true')
    }

    const { data, error } = await query.order('is_system', { ascending: false })

    if (error) {
      console.error('Error fetching accessible books:', error)
      return []
    }

    return data || []
  }

  /**
   * 단어장 상세 조회 (항목 포함)
   */
  async getBookWithItems(bookId: string): Promise<VocabularyBookWithItems | null> {
    const supabase = await this.getClient()
    const { data: book, error: bookError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      console.error('Error fetching book:', bookError)
      return null
    }

    const { data: items, error: itemsError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .select('*')
      .eq('book_id', bookId)
      .order('order_index', { ascending: true })

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
      return { ...book, items: [] }
    }

    return { ...book, items: items || [] }
  }

  /**
   * 새 단어장 생성
   */
  async createBook(book: VocabularyBookInsert): Promise<VocabularyBook | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .insert(book)
      .select()
      .single()

    if (error) {
      console.error('Error creating book:', error)
      return null
    }

    return data
  }

  /**
   * 단어장 업데이트
   */
  async updateBook(bookId: string, updates: Partial<VocabularyBookInsert>): Promise<VocabularyBook | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single()

    if (error) {
      console.error('Error updating book:', error)
      return null
    }

    return data
  }

  /**
   * 단어장 삭제
   */
  async deleteBook(bookId: string): Promise<boolean> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_books')
      .delete()
      .eq('id', bookId)

    if (error) {
      console.error('Error deleting book:', error)
      return false
    }

    return true
  }

  // =====================================================
  // 단어장 항목 (Items) 관련 메서드
  // =====================================================

  /**
   * 단어장 항목 조회
   */
  async getItems(bookId: string): Promise<VocabularyItem[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .select('*')
      .eq('book_id', bookId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching items:', error)
      return []
    }

    return data || []
  }

  /**
   * 사용자 진행도와 함께 항목 조회
   */
  async getItemsWithProgress(bookId: string, userId: string): Promise<VocabularyItemWithProgress[]> {
    const supabase = await this.getClient()
    const { data: items, error: itemsError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .select('*')
      .eq('book_id', bookId)
      .order('order_index', { ascending: true })

    if (itemsError || !items) {
      console.error('Error fetching items:', itemsError)
      return []
    }

    const itemIds = items.map(item => item.id)

    const { data: progressData, error: progressError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('*')
      .eq('user_id', userId)
      .in('item_id', itemIds)

    if (progressError) {
      console.error('Error fetching progress:', progressError)
    }

    const progressMap = new Map(progressData?.map(p => [p.item_id, p]) || [])

    return items.map(item => ({
      ...item,
      progress: progressMap.get(item.id) || null,
    }))
  }

  /**
   * 단일 항목 조회
   */
  async getItem(itemId: string): Promise<VocabularyItem | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (error) {
      console.error('Error fetching item:', error)
      return null
    }

    return data
  }

  /**
   * 새 항목 추가
   */
  async createItem(item: VocabularyItemInsert): Promise<VocabularyItem | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .insert(item)
      .select()
      .single()

    if (error) {
      console.error('Error creating item:', error)
      return null
    }

    return data
  }

  /**
   * 여러 항목 일괄 추가
   */
  async createItems(items: VocabularyItemInsert[]): Promise<VocabularyItem[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .insert(items)
      .select()

    if (error) {
      console.error('Error creating items:', error)
      return []
    }

    return data || []
  }

  /**
   * 항목 업데이트
   */
  async updateItem(itemId: string, updates: Partial<VocabularyItemInsert>): Promise<VocabularyItem | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Error updating item:', error)
      return null
    }

    return data
  }

  /**
   * 항목 삭제
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting item:', error)
      return false
    }

    return true
  }

  // =====================================================
  // 학습 진행도 (Progress) 관련 메서드
  // =====================================================

  /**
   * 사용자의 특정 항목 진행도 조회
   */
  async getProgress(userId: string, itemId: string): Promise<VocabularyProgress | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error)
    }

    return data || null
  }

  /**
   * 진행도 생성 또는 업데이트 (upsert)
   */
  async upsertProgress(progress: VocabularyProgressInsert): Promise<VocabularyProgress | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .upsert(progress, { onConflict: 'user_id,item_id' })
      .select()
      .single()

    if (error) {
      console.error('Error upserting progress:', error)
      return null
    }

    return data
  }

  /**
   * 복습할 항목 조회 (next_review_at이 현재 시간 이전인 항목)
   */
  async getDueForReview(userId: string, limit = 20): Promise<VocabularyItemWithProgress[]> {
    const supabase = await this.getClient()
    const { data: progressData, error: progressError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(limit)

    if (progressError || !progressData || progressData.length === 0) {
      return []
    }

    const itemIds = progressData.map(p => p.item_id)

    const { data: items, error: itemsError } = await supabase
      .schema(SCHEMA)
      .from('vocabulary_items')
      .select('*')
      .in('id', itemIds)

    if (itemsError || !items) {
      return []
    }

    const progressMap = new Map(progressData.map(p => [p.item_id, p]))

    return items.map(item => ({
      ...item,
      progress: progressMap.get(item.id) || null,
    }))
  }

  /**
   * 학습 결과 기록 및 다음 복습 일정 계산
   */
  async recordStudyResult(
    userId: string,
    itemId: string,
    isCorrect: boolean
  ): Promise<VocabularyProgress | null> {
    const existing = await this.getProgress(userId, itemId)

    const now = new Date()
    const masteryLevel = existing?.mastery_level || 0
    const reviewCount = (existing?.review_count || 0) + 1
    const correctCount = (existing?.correct_count || 0) + (isCorrect ? 1 : 0)

    // 마스터리 레벨 조정
    let newMasteryLevel = masteryLevel
    if (isCorrect) {
      newMasteryLevel = Math.min(5, masteryLevel + 1)
    } else {
      newMasteryLevel = Math.max(0, masteryLevel - 1)
    }

    // 다음 복습 시간 계산 (간격 반복 알고리즘)
    const intervals = [0, 1, 3, 7, 14, 30] // 레벨별 복습 간격 (일)
    const daysUntilReview = intervals[newMasteryLevel] || 30
    const nextReviewAt = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000)

    return this.upsertProgress({
      user_id: userId,
      item_id: itemId,
      mastery_level: newMasteryLevel,
      review_count: reviewCount,
      correct_count: correctCount,
      last_reviewed_at: now.toISOString(),
      next_review_at: nextReviewAt.toISOString(),
    })
  }

  /**
   * 단어장의 전체 학습 통계
   */
  async getBookStats(bookId: string, userId: string): Promise<{
    totalItems: number
    studiedItems: number
    masteredItems: number
    averageMastery: number
  }> {
    const items = await this.getItemsWithProgress(bookId, userId)

    const totalItems = items.length
    const studiedItems = items.filter(i => i.progress !== null).length
    const masteredItems = items.filter(i => i.progress && i.progress.mastery_level >= 4).length

    const totalMastery = items.reduce((sum, i) => sum + (i.progress?.mastery_level || 0), 0)
    const averageMastery = totalItems > 0 ? totalMastery / totalItems : 0

    return {
      totalItems,
      studiedItems,
      masteredItems,
      averageMastery,
    }
  }
}

// 싱글톤 인스턴스
export const vocabularyRepository = new VocabularyRepository()
