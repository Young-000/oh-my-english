/**
 * Vocabulary Lookup Service
 *
 * Provides fast lookup of expressions from the vocabulary database.
 * Used to speed up translation responses by checking existing expressions first.
 */

import { createServerSupabaseClient } from '../supabase/server'

const SCHEMA = 'oh_my_english'

// Type for the joined vocabulary_books relation
interface VocabularyBookJoin {
  title: string
  category: string
}

// Type for vocabulary item with joined book data
interface VocabularyItemWithBook {
  korean_expression: string
  english_expression: string
  target_audience: string | null
  formality: 'casual' | 'neutral' | 'formal'
  context_explanation: string | null
  difficulty_level: number
  vocabulary_books: VocabularyBookJoin | null
}

export interface VocabularyMatch {
  korean_expression: string
  english_expression: string
  target_audience: string | null
  formality: 'casual' | 'neutral' | 'formal'
  context_explanation: string | null
  difficulty_level: number
  book_title: string
  book_category: string
}

export interface TranslationFromVocabulary {
  found: true
  source: 'vocabulary'
  data: {
    english: string
    korean: string
    targetAudience: string | null
    formality: 'casual' | 'neutral' | 'formal'
    explanation: string | null
    alternatives: VocabularyMatch[]
    category: string
  }
}

export interface TranslationNotFound {
  found: false
}

export type VocabularyLookupResult = TranslationFromVocabulary | TranslationNotFound

/**
 * Search for a Korean expression in the vocabulary database
 * Uses fuzzy matching to find similar expressions
 */
export async function lookupExpression(
  koreanInput: string
): Promise<VocabularyLookupResult> {
  const supabase = await createServerSupabaseClient()

  // Normalize input - remove extra spaces, trim
  const normalizedInput = koreanInput.trim().replace(/\s+/g, ' ')

  // 1. Try exact match first
  const { data: exactMatch, error: exactError } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_items')
    .select(`
      korean_expression,
      english_expression,
      target_audience,
      formality,
      context_explanation,
      difficulty_level,
      vocabulary_books!inner (
        title,
        category
      )
    `)
    .eq('korean_expression', normalizedInput)
    .limit(1)
    .single()

  if (exactMatch && !exactError) {
    // Found exact match - also get alternatives (similar expressions)
    const alternatives = await findSimilarExpressions(supabase, normalizedInput, exactMatch.korean_expression)
    const typedExact = exactMatch as unknown as VocabularyItemWithBook

    return {
      found: true,
      source: 'vocabulary',
      data: {
        english: exactMatch.english_expression,
        korean: exactMatch.korean_expression,
        targetAudience: typedExact.target_audience,
        formality: typedExact.formality || 'neutral',
        explanation: exactMatch.context_explanation,
        alternatives,
        category: typedExact.vocabulary_books?.category || 'general'
      }
    }
  }

  // 2. Try partial match (contains)
  const { data: partialMatches, error: partialError } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_items')
    .select(`
      korean_expression,
      english_expression,
      target_audience,
      formality,
      context_explanation,
      difficulty_level,
      vocabulary_books!inner (
        title,
        category
      )
    `)
    .ilike('korean_expression', `%${normalizedInput}%`)
    .limit(5)

  if (partialMatches && partialMatches.length > 0 && !partialError) {
    // Sort by similarity (shorter = more similar)
    const typedMatches = partialMatches as unknown as VocabularyItemWithBook[]
    const sorted = typedMatches.sort((a, b) =>
      a.korean_expression.length - b.korean_expression.length
    )

    const best = sorted[0]
    const alternatives = sorted.slice(1).map(item => ({
      korean_expression: item.korean_expression,
      english_expression: item.english_expression,
      target_audience: item.target_audience,
      formality: item.formality || 'neutral',
      context_explanation: item.context_explanation,
      difficulty_level: item.difficulty_level,
      book_title: item.vocabulary_books?.title || '',
      book_category: item.vocabulary_books?.category || 'general'
    }))

    return {
      found: true,
      source: 'vocabulary',
      data: {
        english: best.english_expression,
        korean: best.korean_expression,
        targetAudience: best.target_audience,
        formality: best.formality || 'neutral',
        explanation: best.context_explanation,
        alternatives,
        category: best.vocabulary_books?.category || 'general'
      }
    }
  }

  // 3. No match found
  return { found: false }
}

/**
 * Find similar expressions for alternatives
 */
async function findSimilarExpressions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: string,
  excludeExact: string
): Promise<VocabularyMatch[]> {
  // Get expressions from the same category or with similar keywords
  const keywords = input.split(/[\s,?!.]+/).filter(k => k.length > 1)

  if (keywords.length === 0) return []

  // Search for expressions containing any of the keywords
  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_items')
    .select(`
      korean_expression,
      english_expression,
      target_audience,
      formality,
      context_explanation,
      difficulty_level,
      vocabulary_books!inner (
        title,
        category
      )
    `)
    .neq('korean_expression', excludeExact)
    .or(keywords.map(k => `korean_expression.ilike.%${k}%`).join(','))
    .limit(4)

  if (error || !data) return []

  const typedData = data as unknown as VocabularyItemWithBook[]
  return typedData.map(item => ({
    korean_expression: item.korean_expression,
    english_expression: item.english_expression,
    target_audience: item.target_audience,
    formality: item.formality || 'neutral',
    context_explanation: item.context_explanation,
    difficulty_level: item.difficulty_level,
    book_title: item.vocabulary_books?.title || '',
    book_category: item.vocabulary_books?.category || 'general'
  }))
}

/**
 * Batch lookup for multiple expressions
 */
export async function batchLookupExpressions(
  koreanInputs: string[]
): Promise<Map<string, VocabularyLookupResult>> {
  const supabase = await createServerSupabaseClient()
  const results = new Map<string, VocabularyLookupResult>()

  const normalizedInputs = koreanInputs.map(k => k.trim().replace(/\s+/g, ' '))

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_items')
    .select(`
      korean_expression,
      english_expression,
      target_audience,
      formality,
      context_explanation,
      difficulty_level,
      vocabulary_books!inner (
        title,
        category
      )
    `)
    .in('korean_expression', normalizedInputs)

  if (error || !data) {
    // Return all as not found
    for (const input of koreanInputs) {
      results.set(input, { found: false })
    }
    return results
  }

  // Map found results
  const typedData = data as unknown as VocabularyItemWithBook[]
  const foundMap = new Map(typedData.map(item => [item.korean_expression, item]))

  for (const input of koreanInputs) {
    const normalized = input.trim().replace(/\s+/g, ' ')
    const found = foundMap.get(normalized)

    if (found) {
      results.set(input, {
        found: true,
        source: 'vocabulary',
        data: {
          english: found.english_expression,
          korean: found.korean_expression,
          targetAudience: found.target_audience,
          formality: found.formality || 'neutral',
          explanation: found.context_explanation,
          alternatives: [],
          category: found.vocabulary_books?.category || 'general'
        }
      })
    } else {
      results.set(input, { found: false })
    }
  }

  return results
}

/**
 * Get random expressions for suggestions
 */
export async function getRandomExpressions(
  count: number = 5,
  category?: string
): Promise<VocabularyMatch[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .schema(SCHEMA)
    .from('vocabulary_items')
    .select(`
      korean_expression,
      english_expression,
      target_audience,
      formality,
      context_explanation,
      difficulty_level,
      vocabulary_books!inner (
        title,
        category
      )
    `)

  if (category) {
    query = query.eq('vocabulary_books.category', category)
  }

  // Get total count first
  const { count: totalCount } = await supabase
    .schema(SCHEMA)
    .from('vocabulary_items')
    .select('*', { count: 'exact', head: true })

  if (!totalCount || totalCount === 0) return []

  // Random offset
  const randomOffset = Math.floor(Math.random() * Math.max(0, totalCount - count))

  const { data, error } = await query
    .range(randomOffset, randomOffset + count - 1)

  if (error || !data) return []

  const typedData = data as unknown as VocabularyItemWithBook[]
  return typedData.map(item => ({
    korean_expression: item.korean_expression,
    english_expression: item.english_expression,
    target_audience: item.target_audience,
    formality: item.formality || 'neutral',
    context_explanation: item.context_explanation,
    difficulty_level: item.difficulty_level,
    book_title: item.vocabulary_books?.title || '',
    book_category: item.vocabulary_books?.category || 'general'
  }))
}
