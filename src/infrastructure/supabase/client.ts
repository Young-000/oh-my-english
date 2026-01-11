import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// NEXT_PUBLIC_* 환경 변수는 빌드 타임에 인라인되므로 정적 접근 필요
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
