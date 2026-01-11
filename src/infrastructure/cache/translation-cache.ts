import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TranslationResult } from '@/domain/entities/translation'

export interface CacheEntry {
  translationResult: TranslationResult
  hitCount: number
  createdAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export class TranslationCache {
  constructor(private readonly supabase: AnySupabaseClient) {}

  /**
   * oh_my_english 스키마의 translation_cache 테이블 접근
   */
  private get table() {
    return this.supabase.schema('oh_my_english').from('translation_cache')
  }

  /**
   * 캐시 키 생성 (입력 + 컨텍스트 해시)
   */
  private generateCacheKey(
    koreanInput: string,
    target: string,
    situation: string
  ): string {
    const normalized = `${koreanInput.trim().toLowerCase()}:${target}:${situation}`
    return createHash('sha256').update(normalized).digest('hex').substring(0, 32)
  }

  /**
   * 캐시에서 번역 결과 조회
   */
  async get(
    koreanInput: string,
    target: string,
    situation: string
  ): Promise<CacheEntry | null> {
    const cacheKey = this.generateCacheKey(koreanInput, target, situation)

    const { data, error } = await this.table
      .select('translation_result, hit_count, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (error || !data) {
      return null
    }

    // 히트 카운트 증가 (비동기, 응답 지연 없음)
    this.incrementHitCount(cacheKey)

    return {
      translationResult: data.translation_result as TranslationResult,
      hitCount: data.hit_count as number,
      createdAt: new Date(data.created_at as string),
    }
  }

  /**
   * 캐시 히트 카운트 증가 (비동기)
   */
  private async incrementHitCount(cacheKey: string): Promise<void> {
    try {
      const { data } = await this.table
        .select('hit_count')
        .eq('cache_key', cacheKey)
        .single()

      if (data) {
        await this.table
          .update({
            hit_count: (data.hit_count as number) + 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('cache_key', cacheKey)
      }
    } catch (error) {
      console.error('Failed to increment cache hit:', error)
    }
  }

  /**
   * 번역 결과를 캐시에 저장
   */
  async set(
    koreanInput: string,
    target: string,
    situation: string,
    translationResult: TranslationResult
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(koreanInput, target, situation)

    const { error } = await this.table.upsert(
      {
        cache_key: cacheKey,
        korean_input: koreanInput,
        target_type: target,
        situation_type: situation,
        translation_result: translationResult as unknown as Record<string, unknown>,
        hit_count: 0,
      },
      { onConflict: 'cache_key' }
    )

    if (error) {
      console.error('Failed to cache translation:', error)
    }
  }
}
