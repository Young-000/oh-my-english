export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  oh_my_english: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          settings: {
            dailyGoal: number
            preferredStyle: 'casual' | 'neutral' | 'formal'
            notificationEnabled: boolean
          }
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          settings?: {
            dailyGoal?: number
            preferredStyle?: 'casual' | 'neutral' | 'formal'
            notificationEnabled?: boolean
          }
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          settings?: {
            dailyGoal?: number
            preferredStyle?: 'casual' | 'neutral' | 'formal'
            notificationEnabled?: boolean
          }
          created_at?: string
        }
      }
      learning_records: {
        Row: {
          id: string
          user_id: string
          korean_input: string
          english_expression: string
          context_explanation: string | null
          alternatives: Array<{
            expression: string
            situation: string
            difference: string
          }>
          related_vocabulary: Array<{
            word: string
            meaning: string
            partOfSpeech: string
            exampleSentence: string
          }>
          category: string
          is_bookmarked: boolean
          mastery_level: number
          review_count: number
          next_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          korean_input: string
          english_expression: string
          context_explanation?: string | null
          alternatives?: Array<{
            expression: string
            situation: string
            difference: string
          }>
          related_vocabulary?: Array<{
            word: string
            meaning: string
            partOfSpeech: string
            exampleSentence: string
          }>
          category?: string
          is_bookmarked?: boolean
          mastery_level?: number
          review_count?: number
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          korean_input?: string
          english_expression?: string
          context_explanation?: string | null
          alternatives?: Array<{
            expression: string
            situation: string
            difference: string
          }>
          related_vocabulary?: Array<{
            word: string
            meaning: string
            partOfSpeech: string
            exampleSentence: string
          }>
          category?: string
          is_bookmarked?: boolean
          mastery_level?: number
          review_count?: number
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          record_id: string
          quiz_type: 'korean_to_english' | 'fill_blank' | 'multiple_choice'
          question: string
          user_answer: string | null
          correct_answer: string
          is_correct: boolean
          time_taken_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          record_id: string
          quiz_type: 'korean_to_english' | 'fill_blank' | 'multiple_choice'
          question: string
          user_answer?: string | null
          correct_answer: string
          is_correct: boolean
          time_taken_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          record_id?: string
          quiz_type?: 'korean_to_english' | 'fill_blank' | 'multiple_choice'
          question?: string
          user_answer?: string | null
          correct_answer?: string
          is_correct?: boolean
          time_taken_ms?: number | null
          created_at?: string
        }
      }
      daily_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          expressions_learned: number
          quiz_correct: number
          quiz_total: number
          streak_days: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          expressions_learned?: number
          quiz_correct?: number
          quiz_total?: number
          streak_days?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          expressions_learned?: number
          quiz_correct?: number
          quiz_total?: number
          streak_days?: number
          created_at?: string
        }
      }
      translation_cache: {
        Row: {
          id: string
          cache_key: string
          korean_input: string
          target_type: string
          situation_type: string
          translation_result: Record<string, unknown>
          hit_count: number
          created_at: string
          last_accessed_at: string
        }
        Insert: {
          id?: string
          cache_key: string
          korean_input: string
          target_type?: string
          situation_type?: string
          translation_result: Record<string, unknown>
          hit_count?: number
          created_at?: string
          last_accessed_at?: string
        }
        Update: {
          id?: string
          cache_key?: string
          korean_input?: string
          target_type?: string
          situation_type?: string
          translation_result?: Record<string, unknown>
          hit_count?: number
          created_at?: string
          last_accessed_at?: string
        }
      }
      vocabulary_books: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string | null
          category: string
          is_public: boolean
          is_system: boolean
          cover_emoji: string
          expression_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description?: string | null
          category?: string
          is_public?: boolean
          is_system?: boolean
          cover_emoji?: string
          expression_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string | null
          category?: string
          is_public?: boolean
          is_system?: boolean
          cover_emoji?: string
          expression_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      vocabulary_items: {
        Row: {
          id: string
          book_id: string
          korean_expression: string
          english_expression: string
          pronunciation_guide: string | null
          context_explanation: string | null
          usage_examples: Array<{ korean: string; english: string }>
          alternatives: Array<{ expression: string; situation: string; difference: string }>
          difficulty_level: number
          tags: string[]
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          korean_expression: string
          english_expression: string
          pronunciation_guide?: string | null
          context_explanation?: string | null
          usage_examples?: Array<{ korean: string; english: string }>
          alternatives?: Array<{ expression: string; situation: string; difference: string }>
          difficulty_level?: number
          tags?: string[]
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          korean_expression?: string
          english_expression?: string
          pronunciation_guide?: string | null
          context_explanation?: string | null
          usage_examples?: Array<{ korean: string; english: string }>
          alternatives?: Array<{ expression: string; situation: string; difference: string }>
          difficulty_level?: number
          tags?: string[]
          order_index?: number
          created_at?: string
        }
      }
      vocabulary_progress: {
        Row: {
          id: string
          user_id: string
          item_id: string
          mastery_level: number
          review_count: number
          correct_count: number
          last_reviewed_at: string | null
          next_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          mastery_level?: number
          review_count?: number
          correct_count?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          mastery_level?: number
          review_count?: number
          correct_count?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
