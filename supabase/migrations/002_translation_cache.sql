-- 번역 캐시 테이블
-- 동일한 입력에 대해 API 호출 없이 즉시 응답

CREATE TABLE IF NOT EXISTS oh_my_english.translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 캐시 키 (입력 + 컨텍스트의 해시)
  cache_key TEXT UNIQUE NOT NULL,

  -- 원본 입력
  korean_input TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'adult',
  situation_type TEXT NOT NULL DEFAULT 'casual',

  -- 번역 결과 (JSON)
  translation_result JSONB NOT NULL,

  -- 메타데이터
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐시 키 인덱스 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_translation_cache_key
ON oh_my_english.translation_cache(cache_key);

-- 자주 사용되는 캐시 우선 조회
CREATE INDEX IF NOT EXISTS idx_translation_cache_hits
ON oh_my_english.translation_cache(hit_count DESC);

-- RLS 정책 (캐시는 모든 사용자가 읽기 가능)
ALTER TABLE oh_my_english.translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache" ON oh_my_english.translation_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert cache" ON oh_my_english.translation_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update cache" ON oh_my_english.translation_cache
  FOR UPDATE USING (true);
