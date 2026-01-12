-- Oh My English - Vocabulary Books & Seed Data
-- Version: 003
-- Schema: oh_my_english

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 단어장 테이블 (Vocabulary Books)
-- =====================================================

-- 단어장 (사용자가 생성하거나 시스템에서 제공하는 표현 모음)
CREATE TABLE IF NOT EXISTS oh_my_english.vocabulary_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES oh_my_english.profiles(id) ON DELETE CASCADE,  -- NULL이면 시스템 제공 단어장
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,  -- 다른 사용자에게 공개 여부
  is_system BOOLEAN DEFAULT FALSE,  -- 시스템 기본 제공 단어장
  cover_emoji TEXT DEFAULT '📚',
  expression_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 단어장 항목 (단어장에 포함된 표현들)
CREATE TABLE IF NOT EXISTS oh_my_english.vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES oh_my_english.vocabulary_books(id) ON DELETE CASCADE,
  korean_expression TEXT NOT NULL,
  english_expression TEXT NOT NULL,
  pronunciation_guide TEXT,  -- 발음 가이드 (예: "워라이? 유두잉?")
  context_explanation TEXT,
  usage_examples JSONB DEFAULT '[]'::jsonb,  -- [{korean: "...", english: "..."}]
  alternatives JSONB DEFAULT '[]'::jsonb,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자별 단어장 학습 진행 상황
CREATE TABLE IF NOT EXISTS oh_my_english.vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES oh_my_english.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES oh_my_english.vocabulary_items(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vocabulary_books_user_id ON oh_my_english.vocabulary_books(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_books_is_system ON oh_my_english.vocabulary_books(is_system) WHERE is_system = TRUE;
CREATE INDEX IF NOT EXISTS idx_vocabulary_books_is_public ON oh_my_english.vocabulary_books(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_book_id ON oh_my_english.vocabulary_items(book_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_tags ON oh_my_english.vocabulary_items USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_user_id ON oh_my_english.vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_progress_next_review ON oh_my_english.vocabulary_progress(user_id, next_review_at) WHERE next_review_at IS NOT NULL;

-- RLS 활성화
ALTER TABLE oh_my_english.vocabulary_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_my_english.vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_my_english.vocabulary_progress ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 단어장: 시스템/공개 단어장은 모두 볼 수 있고, 자기 단어장은 관리 가능
CREATE POLICY "Anyone can view system and public books" ON oh_my_english.vocabulary_books
  FOR SELECT USING (is_system = TRUE OR is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage own books" ON oh_my_english.vocabulary_books
  FOR ALL USING (auth.uid() = user_id);

-- 단어장 항목: 시스템/공개 단어장 항목은 모두 볼 수 있음
CREATE POLICY "Anyone can view items in accessible books" ON oh_my_english.vocabulary_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM oh_my_english.vocabulary_books b
      WHERE b.id = book_id AND (b.is_system = TRUE OR b.is_public = TRUE OR b.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage items in own books" ON oh_my_english.vocabulary_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM oh_my_english.vocabulary_books b
      WHERE b.id = book_id AND b.user_id = auth.uid()
    )
  );

-- 학습 진행: 자신의 진행 상황만 관리
CREATE POLICY "Users can manage own progress" ON oh_my_english.vocabulary_progress
  FOR ALL USING (auth.uid() = user_id);

-- 트리거: 단어장 항목 수 자동 업데이트
CREATE OR REPLACE FUNCTION oh_my_english.update_book_expression_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE oh_my_english.vocabulary_books
    SET expression_count = expression_count + 1, updated_at = NOW()
    WHERE id = NEW.book_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE oh_my_english.vocabulary_books
    SET expression_count = expression_count - 1, updated_at = NOW()
    WHERE id = OLD.book_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vocabulary_items_count
  AFTER INSERT OR DELETE ON oh_my_english.vocabulary_items
  FOR EACH ROW
  EXECUTE FUNCTION oh_my_english.update_book_expression_count();

-- =====================================================
-- 2. 시스템 기본 단어장 (시드 데이터)
-- =====================================================

-- 시스템 단어장 1: 일상 인사/안부
INSERT INTO oh_my_english.vocabulary_books (id, user_id, title, description, category, is_system, cover_emoji)
VALUES (
  'a0000001-0000-0000-0000-000000000001',
  NULL,
  '일상 인사와 안부',
  '매일 사용하는 인사말과 안부를 묻는 표현들',
  'daily',
  TRUE,
  '👋'
) ON CONFLICT DO NOTHING;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, usage_examples, alternatives, difficulty_level, tags, order_index)
VALUES
  ('a0000001-0000-0000-0000-000000000001', '밥 먹었어?', 'Have you eaten?', '해브 유 이튼?', '한국식 안부 인사. 영어권에서는 직역보다 상황에 맞는 인사가 자연스럽습니다.', '[{"korean": "점심 먹었어?", "english": "Have you had lunch?"}]', '[{"expression": "How are you doing?", "situation": "일반적인 안부", "difference": "더 일반적인 영어식 인사"}]', 1, ARRAY['인사', '일상', '안부'], 1),
  ('a0000001-0000-0000-0000-000000000001', '잘 지내?', 'How have you been?', '하우 해브 유 빈?', '오랜만에 만난 사람에게 사용하는 표현', '[{"korean": "요즘 어떻게 지내?", "english": "How have you been lately?"}]', '[{"expression": "What''s up?", "situation": "친한 친구에게", "difference": "더 캐주얼한 표현"}]', 1, ARRAY['인사', '안부'], 2),
  ('a0000001-0000-0000-0000-000000000001', '오랜만이야!', 'Long time no see!', '롱 타임 노 씨!', '오랜만에 만났을 때 반가움을 표현', '[{"korean": "정말 오랜만이다!", "english": "It''s been ages!"}]', '[{"expression": "It''s been a while!", "situation": "조금 더 격식있게", "difference": "약간 더 formal한 느낌"}]', 1, ARRAY['인사', '만남'], 3),
  ('a0000001-0000-0000-0000-000000000001', '어디 가?', 'Where are you headed?', '웨어 아 유 헤디드?', '길에서 마주쳤을 때 자연스러운 인사', '[{"korean": "어디 가는 길이야?", "english": "Where are you off to?"}]', '[{"expression": "Where are you going?", "situation": "직접적인 표현", "difference": "더 직접적이지만 자연스러움"}]', 1, ARRAY['인사', '일상'], 4),
  ('a0000001-0000-0000-0000-000000000001', '조심히 가!', 'Take care!', '테이크 케어!', '헤어질 때 상대를 배려하는 표현', '[{"korean": "잘 가!", "english": "See you!"}]', '[{"expression": "Get home safe!", "situation": "밤에 헤어질 때", "difference": "안전하게 집에 가라는 의미"}]', 1, ARRAY['인사', '작별'], 5),
  ('a0000001-0000-0000-0000-000000000001', '수고했어!', 'Good job!', '굿 잡!', '일을 마친 사람에게 노고를 치하', '[{"korean": "오늘 수고 많았어", "english": "You did great today!"}]', '[{"expression": "Well done!", "situation": "성과를 칭찬할 때", "difference": "성과에 더 초점"}]', 2, ARRAY['인사', '직장', '칭찬'], 6),
  ('a0000001-0000-0000-0000-000000000001', '먼저 갈게', 'I gotta go', '아이 가타 고', '자리를 먼저 뜰 때 사용', '[{"korean": "나 먼저 가볼게", "english": "I should get going"}]', '[{"expression": "I have to run", "situation": "급할 때", "difference": "더 급한 느낌"}]', 1, ARRAY['작별', '일상'], 7),
  ('a0000001-0000-0000-0000-000000000001', '연락해!', 'Keep in touch!', '킵 인 터치!', '헤어지면서 연락 유지를 부탁할 때', '[{"korean": "자주 연락하자", "english": "Let''s keep in touch"}]', '[{"expression": "Hit me up!", "situation": "친한 친구에게", "difference": "매우 캐주얼한 표현"}]', 1, ARRAY['작별', '친구'], 8);

-- 시스템 단어장 2: 감정 표현
INSERT INTO oh_my_english.vocabulary_books (id, user_id, title, description, category, is_system, cover_emoji)
VALUES (
  'a0000001-0000-0000-0000-000000000002',
  NULL,
  '감정과 기분 표현',
  '다양한 감정과 기분을 표현하는 영어 표현들',
  'emotion',
  TRUE,
  '😊'
) ON CONFLICT DO NOTHING;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, usage_examples, alternatives, difficulty_level, tags, order_index)
VALUES
  ('a0000001-0000-0000-0000-000000000002', '너무 좋아!', 'I love it!', '아이 러브 잇!', '무언가가 정말 마음에 들 때', '[{"korean": "이거 진짜 좋다!", "english": "This is amazing!"}]', '[{"expression": "It''s awesome!", "situation": "캐주얼하게", "difference": "젊은 층이 많이 사용"}]', 1, ARRAY['감정', '긍정'], 1),
  ('a0000001-0000-0000-0000-000000000002', '짜증나!', 'That''s so annoying!', '댓츠 쏘 어노잉!', '무언가가 신경 쓰일 때', '[{"korean": "진짜 짜증나네", "english": "That really bugs me"}]', '[{"expression": "It''s frustrating", "situation": "조금 더 formal하게", "difference": "더 점잖은 표현"}]', 2, ARRAY['감정', '부정'], 2),
  ('a0000001-0000-0000-0000-000000000002', '피곤해 죽겠어', 'I''m exhausted', '아임 이그저스티드', '극도로 피곤할 때', '[{"korean": "완전 녹초야", "english": "I''m wiped out"}]', '[{"expression": "I''m beat", "situation": "캐주얼하게", "difference": "구어체 표현"}]', 2, ARRAY['감정', '피로'], 3),
  ('a0000001-0000-0000-0000-000000000002', '설레어!', 'I''m so excited!', '아임 쏘 익사이티드!', '기대되고 설레는 감정', '[{"korean": "너무 기대돼!", "english": "I can''t wait!"}]', '[{"expression": "I''m thrilled!", "situation": "더 강한 설렘", "difference": "매우 흥분된 상태"}]', 1, ARRAY['감정', '긍정', '기대'], 4),
  ('a0000001-0000-0000-0000-000000000002', '우울해', 'I''m feeling down', '아임 필링 다운', '기분이 가라앉았을 때', '[{"korean": "기분이 안 좋아", "english": "I''m in a bad mood"}]', '[{"expression": "I feel blue", "situation": "우울한 감정", "difference": "더 시적인 표현"}]', 2, ARRAY['감정', '부정'], 5),
  ('a0000001-0000-0000-0000-000000000002', '화나!', 'I''m so mad!', '아임 쏘 매드!', '화가 날 때', '[{"korean": "진짜 열받아", "english": "I''m so pissed off"}]', '[{"expression": "I''m furious", "situation": "매우 화났을 때", "difference": "더 강한 분노"}]', 2, ARRAY['감정', '분노'], 6),
  ('a0000001-0000-0000-0000-000000000002', '감동받았어', 'I was so touched', '아이 워즈 쏘 터치드', '마음이 뭉클할 때', '[{"korean": "눈물 날 뻔했어", "english": "It almost made me cry"}]', '[{"expression": "I was moved", "situation": "formal하게", "difference": "더 격식있는 표현"}]', 2, ARRAY['감정', '감동'], 7),
  ('a0000001-0000-0000-0000-000000000002', '긴장돼', 'I''m nervous', '아임 너버스', '떨리고 긴장될 때', '[{"korean": "떨려 죽겠어", "english": "I have butterflies in my stomach"}]', '[{"expression": "I''m anxious", "situation": "불안할 때", "difference": "불안 요소가 있을 때"}]', 2, ARRAY['감정', '긴장'], 8);

-- 시스템 단어장 3: 일상 대화
INSERT INTO oh_my_english.vocabulary_books (id, user_id, title, description, category, is_system, cover_emoji)
VALUES (
  'a0000001-0000-0000-0000-000000000003',
  NULL,
  '일상 대화 필수 표현',
  '일상에서 자주 쓰는 실용적인 표현들',
  'daily',
  TRUE,
  '💬'
) ON CONFLICT DO NOTHING;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, usage_examples, alternatives, difficulty_level, tags, order_index)
VALUES
  ('a0000001-0000-0000-0000-000000000003', '뭐 해?', 'What are you up to?', '왓 아 유 업 투?', '상대가 뭘 하고 있는지 물을 때', '[{"korean": "지금 뭐 하고 있어?", "english": "What are you doing right now?"}]', '[{"expression": "Whatcha doing?", "situation": "아주 친한 사이", "difference": "매우 캐주얼한 축약형"}]', 1, ARRAY['일상', '대화'], 1),
  ('a0000001-0000-0000-0000-000000000003', '그냥 그래', 'So-so', '쏘-쏘', '특별히 좋지도 나쁘지도 않을 때', '[{"korean": "뭐 그럭저럭", "english": "It''s okay, I guess"}]', '[{"expression": "Not too bad", "situation": "약간 긍정적으로", "difference": "조금 더 괜찮은 느낌"}]', 1, ARRAY['일상', '대화'], 2),
  ('a0000001-0000-0000-0000-000000000003', '나 바빠', 'I''m busy', '아임 비지', '바쁜 상황일 때', '[{"korean": "지금 좀 바빠", "english": "I''m kind of busy right now"}]', '[{"expression": "I''m swamped", "situation": "매우 바쁠 때", "difference": "일에 파묻혔다는 느낌"}]', 1, ARRAY['일상', '상태'], 3),
  ('a0000001-0000-0000-0000-000000000003', '잠깐만', 'Hold on', '홀드 온', '잠시 기다려 달라고 할 때', '[{"korean": "잠깐만 기다려", "english": "Give me a sec"}]', '[{"expression": "Just a moment", "situation": "정중하게", "difference": "더 formal한 표현"}]', 1, ARRAY['일상', '요청'], 4),
  ('a0000001-0000-0000-0000-000000000003', '알았어', 'Got it', '갓 잇', '이해했다고 할 때', '[{"korean": "알겠어", "english": "I understand"}]', '[{"expression": "Gotcha", "situation": "아주 캐주얼하게", "difference": "친한 사이에 사용"}]', 1, ARRAY['일상', '응답'], 5),
  ('a0000001-0000-0000-0000-000000000003', '몰라', 'I don''t know', '아이 돈 노우', '모르는 것에 대해', '[{"korean": "글쎄", "english": "I''m not sure"}]', '[{"expression": "No idea", "situation": "전혀 모를 때", "difference": "더 강조된 표현"}]', 1, ARRAY['일상', '응답'], 6),
  ('a0000001-0000-0000-0000-000000000003', '진짜?', 'Really?', '리얼리?', '놀라움이나 확인', '[{"korean": "정말?", "english": "Seriously?"}]', '[{"expression": "For real?", "situation": "캐주얼하게 놀람", "difference": "젊은 층이 자주 사용"}]', 1, ARRAY['일상', '반응'], 7),
  ('a0000001-0000-0000-0000-000000000003', '그래서?', 'So what?', '쏘 왓?', '그게 어쨌다는 건지 물을 때', '[{"korean": "그래서 뭐?", "english": "And?"}]', '[{"expression": "What''s your point?", "situation": "요점을 물을 때", "difference": "더 직접적인 질문"}]', 2, ARRAY['일상', '대화'], 8),
  ('a0000001-0000-0000-0000-000000000003', '왜 그래?', 'What''s wrong?', '왓츠 롱?', '상대가 이상할 때', '[{"korean": "무슨 일이야?", "english": "What happened?"}]', '[{"expression": "Is everything okay?", "situation": "걱정하며 물을 때", "difference": "더 부드러운 질문"}]', 1, ARRAY['일상', '대화'], 9),
  ('a0000001-0000-0000-0000-000000000003', '그럴 수 있지', 'It happens', '잇 해픈즈', '실수를 위로할 때', '[{"korean": "누구나 그럴 수 있어", "english": "It could happen to anyone"}]', '[{"expression": "Don''t worry about it", "situation": "걱정 말라고 할 때", "difference": "위로하는 느낌"}]', 2, ARRAY['일상', '위로'], 10);

-- 시스템 단어장 4: 비즈니스/직장
INSERT INTO oh_my_english.vocabulary_books (id, user_id, title, description, category, is_system, cover_emoji)
VALUES (
  'a0000001-0000-0000-0000-000000000004',
  NULL,
  '비즈니스 영어 표현',
  '직장에서 자주 쓰는 비즈니스 영어 표현',
  'business',
  TRUE,
  '💼'
) ON CONFLICT DO NOTHING;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, usage_examples, alternatives, difficulty_level, tags, order_index)
VALUES
  ('a0000001-0000-0000-0000-000000000004', '회의 잡아주세요', 'Could you schedule a meeting?', '쿠쥬 스케쥴 어 미팅?', '회의 일정을 잡아달라고 요청', '[{"korean": "미팅 일정 잡아줄 수 있어요?", "english": "Can we set up a meeting?"}]', '[{"expression": "Let''s book a meeting", "situation": "직접적으로", "difference": "더 직접적인 표현"}]', 2, ARRAY['비즈니스', '요청'], 1),
  ('a0000001-0000-0000-0000-000000000004', '검토해보겠습니다', 'I''ll look into it', '아일 룩 인투 잇', '확인하고 답하겠다는 의미', '[{"korean": "확인해볼게요", "english": "Let me check on that"}]', '[{"expression": "I''ll get back to you", "situation": "답변을 주겠다고 할 때", "difference": "회신하겠다는 의미 포함"}]', 2, ARRAY['비즈니스', '응답'], 2),
  ('a0000001-0000-0000-0000-000000000004', '마감일이 언제예요?', 'When is the deadline?', '웬 이즈 더 데드라인?', '마감 시한을 확인할 때', '[{"korean": "언제까지 해야 해요?", "english": "When do you need this by?"}]', '[{"expression": "What''s the timeline?", "situation": "일정을 물을 때", "difference": "전체 일정을 묻는 느낌"}]', 2, ARRAY['비즈니스', '일정'], 3),
  ('a0000001-0000-0000-0000-000000000004', '제 의견은요', 'In my opinion', '인 마이 오피니언', '자신의 생각을 말할 때', '[{"korean": "제 생각에는", "english": "I think that..."}]', '[{"expression": "From my perspective", "situation": "더 formal하게", "difference": "더 격식 있는 표현"}]', 2, ARRAY['비즈니스', '의견'], 4),
  ('a0000001-0000-0000-0000-000000000004', '죄송하지만', 'I''m sorry, but', '아임 쏘리, 벗', '정중하게 반대하거나 거절할 때', '[{"korean": "죄송한데요", "english": "I apologize, however..."}]', '[{"expression": "Unfortunately", "situation": "안타까운 소식 전할 때", "difference": "부정적인 결과 전달"}]', 2, ARRAY['비즈니스', '사과'], 5),
  ('a0000001-0000-0000-0000-000000000004', '확인해주세요', 'Please confirm', '플리즈 컨펌', '확인을 요청할 때', '[{"korean": "검토 후 확인 부탁드려요", "english": "Please review and confirm"}]', '[{"expression": "Could you verify?", "situation": "검증을 요청할 때", "difference": "정확성 확인 요청"}]', 2, ARRAY['비즈니스', '요청'], 6),
  ('a0000001-0000-0000-0000-000000000004', '수고하셨습니다', 'Great work everyone', '그레잇 워크 에브리원', '회의나 프로젝트 종료 시', '[{"korean": "다들 고생하셨어요", "english": "Thank you all for your hard work"}]', '[{"expression": "Good job, team", "situation": "팀에게", "difference": "팀 성과를 칭찬"}]', 2, ARRAY['비즈니스', '칭찬'], 7),
  ('a0000001-0000-0000-0000-000000000004', '참고로', 'For your reference', '포 유어 레퍼런스', '추가 정보를 제공할 때', '[{"korean": "참고하세요", "english": "FYI (For Your Information)"}]', '[{"expression": "Just so you know", "situation": "캐주얼하게", "difference": "더 가벼운 느낌"}]', 2, ARRAY['비즈니스', '정보'], 8);

-- 시스템 단어장 5: 음식/식당
INSERT INTO oh_my_english.vocabulary_books (id, user_id, title, description, category, is_system, cover_emoji)
VALUES (
  'a0000001-0000-0000-0000-000000000005',
  NULL,
  '음식과 식당 표현',
  '식당에서 주문하고 음식에 대해 이야기할 때 쓰는 표현',
  'food',
  TRUE,
  '🍽️'
) ON CONFLICT DO NOTHING;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, usage_examples, alternatives, difficulty_level, tags, order_index)
VALUES
  ('a0000001-0000-0000-0000-000000000005', '뭐 먹을래?', 'What would you like to eat?', '왓 우쥬 라익 투 잇?', '무엇을 먹을지 물을 때', '[{"korean": "뭐 먹고 싶어?", "english": "What do you feel like eating?"}]', '[{"expression": "What are you in the mood for?", "situation": "기분에 따라 물을 때", "difference": "기분/입맛을 고려한 질문"}]', 1, ARRAY['음식', '질문'], 1),
  ('a0000001-0000-0000-0000-000000000005', '이거 맛있어!', 'This is delicious!', '디스 이즈 딜리셔스!', '음식이 맛있을 때', '[{"korean": "진짜 맛있다!", "english": "This is so good!"}]', '[{"expression": "Yummy!", "situation": "캐주얼하게", "difference": "아이들도 많이 사용하는 표현"}]', 1, ARRAY['음식', '감탄'], 2),
  ('a0000001-0000-0000-0000-000000000005', '배불러', 'I''m full', '아임 풀', '배가 부를 때', '[{"korean": "배 터지겠어", "english": "I''m stuffed"}]', '[{"expression": "I can''t eat another bite", "situation": "정말 배부를 때", "difference": "한 입도 더 못 먹겠다는 의미"}]', 1, ARRAY['음식', '상태'], 3),
  ('a0000001-0000-0000-0000-000000000005', '배고파', 'I''m hungry', '아임 헝그리', '배가 고플 때', '[{"korean": "배고파 죽겠어", "english": "I''m starving"}]', '[{"expression": "I could eat a horse", "situation": "매우 배고플 때", "difference": "과장된 표현"}]', 1, ARRAY['음식', '상태'], 4),
  ('a0000001-0000-0000-0000-000000000005', '메뉴 주세요', 'Can I see the menu?', '캔 아이 씨 더 메뉴?', '식당에서 메뉴판 요청', '[{"korean": "메뉴판 좀 볼 수 있을까요?", "english": "Could I have a menu, please?"}]', '[{"expression": "May I see the menu?", "situation": "더 정중하게", "difference": "더 격식있는 표현"}]', 1, ARRAY['음식', '식당', '요청'], 5),
  ('a0000001-0000-0000-0000-000000000005', '계산서 주세요', 'Can I have the check?', '캔 아이 해브 더 체크?', '계산할 때', '[{"korean": "계산할게요", "english": "I''d like to pay, please"}]', '[{"expression": "The bill, please", "situation": "영국식 표현", "difference": "영국에서는 bill을 더 많이 사용"}]', 1, ARRAY['음식', '식당', '계산'], 6),
  ('a0000001-0000-0000-0000-000000000005', '이거 추천해요', 'I recommend this', '아이 레커멘드 디스', '음식을 추천할 때', '[{"korean": "이거 진짜 맛있어", "english": "You should try this"}]', '[{"expression": "This is a must-try", "situation": "강력 추천", "difference": "꼭 먹어봐야 한다는 의미"}]', 1, ARRAY['음식', '추천'], 7),
  ('a0000001-0000-0000-0000-000000000005', '나 이거 못 먹어', 'I can''t eat this', '아이 캔트 잇 디스', '음식을 먹을 수 없을 때', '[{"korean": "저 땅콩 알레르기 있어요", "english": "I''m allergic to peanuts"}]', '[{"expression": "I''m a vegetarian", "situation": "채식주의자일 때", "difference": "음식 제한 설명"}]', 2, ARRAY['음식', '알레르기'], 8);

-- 단어장 항목 수 업데이트 (트리거가 INSERT 시 자동 업데이트하지만 시드 데이터는 수동 업데이트 필요)
UPDATE oh_my_english.vocabulary_books SET expression_count = (
  SELECT COUNT(*) FROM oh_my_english.vocabulary_items WHERE book_id = vocabulary_books.id
) WHERE is_system = TRUE;
