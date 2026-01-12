-- Expanded Vocabulary by Target Audience and Situation
-- 대상별, 상황별로 구분된 확장 단어장

-- ============================================
-- 1. 아이에게 말할 때 (Speaking to Children)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000001-0000-0000-0000-000000000001',
  '👶 아이에게 말할 때',
  '아이들과 대화할 때 사용하는 쉽고 따뜻한 표현들',
  true,
  'target_child',
  '👶'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000001-0000-0000-0000-000000000001', '잘했어!', 'Good job!', '굿 잡', 'Good job! You did it!', 1, 1),
('b0000001-0000-0000-0000-000000000001', '괜찮아, 걱정마', 'It''s okay, don''t worry', '잇츠 오케이, 돈트 워리', 'It''s okay, don''t worry. I''m here.', 1, 2),
('b0000001-0000-0000-0000-000000000001', '손 씻었어?', 'Did you wash your hands?', '디쥬 워시 유어 핸즈', 'Did you wash your hands before eating?', 1, 3),
('b0000001-0000-0000-0000-000000000001', '배고프지?', 'Are you hungry?', '아 유 헝그리', 'Are you hungry? Let''s eat!', 1, 4),
('b0000001-0000-0000-0000-000000000001', '이제 자야지', 'It''s time to sleep', '잇츠 타임 투 슬립', 'It''s time to sleep. Good night!', 1, 5),
('b0000001-0000-0000-0000-000000000001', '조심해!', 'Be careful!', '비 케어풀', 'Be careful! Watch your step.', 1, 6),
('b0000001-0000-0000-0000-000000000001', '같이 놀자', 'Let''s play together', '렛츠 플레이 투게더', 'Let''s play together! What do you want to play?', 1, 7),
('b0000001-0000-0000-0000-000000000001', '안아줄까?', 'Do you want a hug?', '두유 원트 어 헉', 'Do you want a hug? Come here.', 1, 8),
('b0000001-0000-0000-0000-000000000001', '뭐 하고 있어?', 'What are you doing?', '왓 아 유 두잉', 'What are you doing? Can I see?', 1, 9),
('b0000001-0000-0000-0000-000000000001', '착하다, 우리 아기', 'Good boy/girl', '굿 보이/걸', 'Good boy! You''re so kind.', 1, 10),
('b0000001-0000-0000-0000-000000000001', '다쳤어?', 'Did you hurt yourself?', '디쥬 허트 유어셀프', 'Did you hurt yourself? Let me see.', 1, 11),
('b0000001-0000-0000-0000-000000000001', '얼마나 사랑하는지 알아?', 'Do you know how much I love you?', '두유 노 하우 머치 아이 러브유', 'Do you know how much I love you? This much!', 1, 12),
('b0000001-0000-0000-0000-000000000001', '정리할 시간이야', 'It''s time to clean up', '잇츠 타임 투 클린 업', 'It''s time to clean up your toys.', 1, 13),
('b0000001-0000-0000-0000-000000000001', '화났어?', 'Are you upset?', '아 유 업셋', 'Are you upset? Tell me what happened.', 1, 14),
('b0000001-0000-0000-0000-000000000001', '대단해!', 'Amazing!', '어메이징', 'Amazing! You''re so smart!', 1, 15);

-- ============================================
-- 2. 친구에게 (Casual with Friends)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000002-0000-0000-0000-000000000002',
  '👫 친구끼리 편하게',
  '친구들과 편하게 나누는 캐주얼한 일상 표현',
  true,
  'target_friend',
  '👫'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000002-0000-0000-0000-000000000002', '뭐해?', 'What''s up?', '왓츠 업', 'Hey! What''s up?', 1, 1),
('b0000002-0000-0000-0000-000000000002', '오랜만이다!', 'Long time no see!', '롱 타임 노 씨', 'Long time no see! How have you been?', 1, 2),
('b0000002-0000-0000-0000-000000000002', '나 완전 배고파', 'I''m starving', '아임 스타빙', 'I''m starving. Let''s grab something to eat.', 1, 3),
('b0000002-0000-0000-0000-000000000002', '진짜? 대박!', 'Really? No way!', '리얼리? 노 웨이', 'Really? No way! That''s awesome!', 1, 4),
('b0000002-0000-0000-0000-000000000002', '나 오늘 완전 피곤해', 'I''m so tired today', '아임 쏘 타이어드 투데이', 'I''m so tired today. Work was crazy.', 1, 5),
('b0000002-0000-0000-0000-000000000002', '한잔 하자', 'Let''s grab a drink', '렛츠 그랩 어 드링크', 'Let''s grab a drink after work.', 2, 6),
('b0000002-0000-0000-0000-000000000002', '그거 완전 웃겨', 'That''s hilarious', '댓츠 힐레리어스', 'That''s hilarious! I can''t stop laughing.', 2, 7),
('b0000002-0000-0000-0000-000000000002', '야, 장난이지?', 'Come on, you''re kidding, right?', '컴온, 유어 키딩 롸잇', 'Come on, you''re kidding, right?', 2, 8),
('b0000002-0000-0000-0000-000000000002', '완전 공감해', 'I totally get it', '아이 토탈리 겟잇', 'I totally get it. I''ve been there.', 2, 9),
('b0000002-0000-0000-0000-000000000002', '그래서 어떻게 됐어?', 'So what happened?', '쏘 왓 해픈드', 'So what happened? Tell me everything!', 1, 10),
('b0000002-0000-0000-0000-000000000002', '미쳤다 진짜', 'That''s crazy', '댓츠 크레이지', 'That''s crazy! I can''t believe it.', 1, 11),
('b0000002-0000-0000-0000-000000000002', '오늘 뭐 하기로 했더라?', 'What were we supposed to do today?', '왓 워 위 서포즈드 투 두 투데이', 'What were we supposed to do today again?', 2, 12),
('b0000002-0000-0000-0000-000000000002', '좀 쉬어야겠다', 'I need a break', '아이 니드 어 브레이크', 'I need a break. This week was intense.', 2, 13),
('b0000002-0000-0000-0000-000000000002', '걔 아직도 그래?', 'Is he/she still like that?', '이즈 히/쉬 스틸 라익 댓', 'Is he still like that? Some things never change.', 2, 14),
('b0000002-0000-0000-0000-000000000002', '나중에 연락해', 'Hit me up later', '힛 미 업 레이터', 'Hit me up later when you''re free.', 2, 15);

-- ============================================
-- 3. 직장 동료에게 (With Coworkers)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000003-0000-0000-0000-000000000003',
  '👔 직장 동료와 대화',
  '회사에서 동료들과 자연스럽게 대화하는 표현',
  true,
  'target_coworker',
  '👔'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000003-0000-0000-0000-000000000003', '좋은 아침이에요', 'Good morning', '굿 모닝', 'Good morning! Ready for the meeting?', 1, 1),
('b0000003-0000-0000-0000-000000000003', '점심 먹었어요?', 'Have you had lunch?', '해브 유 해드 런치', 'Have you had lunch? Want to grab something together?', 1, 2),
('b0000003-0000-0000-0000-000000000003', '이거 좀 봐주실 수 있어요?', 'Could you take a look at this?', '쿠쥬 테이크 어 룩 앳 디스', 'Could you take a look at this when you have a moment?', 2, 3),
('b0000003-0000-0000-0000-000000000003', '수고하셨어요', 'Good work today', '굿 워크 투데이', 'Good work today! See you tomorrow.', 1, 4),
('b0000003-0000-0000-0000-000000000003', '회의 언제예요?', 'When is the meeting?', '웬 이즈 더 미팅', 'When is the meeting? I want to prepare.', 1, 5),
('b0000003-0000-0000-0000-000000000003', '이메일 확인했어요?', 'Did you see the email?', '디쥬 씨 디 이메일', 'Did you see the email I sent this morning?', 1, 6),
('b0000003-0000-0000-0000-000000000003', '마감이 언제예요?', 'When is the deadline?', '웬 이즈 더 데드라인', 'When is the deadline for this project?', 2, 7),
('b0000003-0000-0000-0000-000000000003', '잠깐 얘기 좀 할 수 있어요?', 'Can we talk for a minute?', '캔 위 톡 포 어 미닛', 'Can we talk for a minute? I have a quick question.', 2, 8),
('b0000003-0000-0000-0000-000000000003', '도움이 필요하면 말씀하세요', 'Let me know if you need any help', '렛 미 노 이프 유 니드 애니 헬프', 'Let me know if you need any help with that.', 2, 9),
('b0000003-0000-0000-0000-000000000003', '이거 어떻게 생각해요?', 'What do you think about this?', '왓 두유 띵크 어바웃 디스', 'What do you think about this approach?', 2, 10),
('b0000003-0000-0000-0000-000000000003', '커피 마실래요?', 'Want to grab a coffee?', '원투 그랩 어 커피', 'Want to grab a coffee? I need a break.', 1, 11),
('b0000003-0000-0000-0000-000000000003', '이따 회의에서 봐요', 'See you at the meeting later', '씨유 앳 더 미팅 레이터', 'See you at the meeting later.', 1, 12),
('b0000003-0000-0000-0000-000000000003', '주말 잘 보내세요', 'Have a great weekend', '해브 어 그레이트 위켄드', 'Have a great weekend! See you Monday.', 1, 13),
('b0000003-0000-0000-0000-000000000003', '진행 상황이 어떻게 되나요?', 'How is it going?', '하우 이즈 잇 고잉', 'How is the project going? Any updates?', 2, 14),
('b0000003-0000-0000-0000-000000000003', '이거 급한 건가요?', 'Is this urgent?', '이즈 디스 어전트', 'Is this urgent? I have a few things to wrap up first.', 2, 15);

-- ============================================
-- 4. 비즈니스/격식 (Formal Business)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000004-0000-0000-0000-000000000004',
  '💼 비즈니스 격식체',
  '공식 미팅, 이메일, 프레젠테이션에서 사용하는 격식있는 표현',
  true,
  'situation_formal',
  '💼'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000004-0000-0000-0000-000000000004', '만나서 반갑습니다', 'It''s a pleasure to meet you', '잇츠 어 플레져 투 밋 유', 'It''s a pleasure to meet you. I''ve heard great things about your work.', 3, 1),
('b0000004-0000-0000-0000-000000000004', '시간 내주셔서 감사합니다', 'Thank you for your time', '땡큐 포 유어 타임', 'Thank you for your time. I really appreciate it.', 2, 2),
('b0000004-0000-0000-0000-000000000004', '검토해 주시겠습니까?', 'Would you be able to review this?', '우쥬 비 에이블 투 리뷰 디스', 'Would you be able to review this by end of day?', 3, 3),
('b0000004-0000-0000-0000-000000000004', '제안드리고 싶은 게 있습니다', 'I would like to propose something', '아이 우드 라이크 투 프로포즈 썸띵', 'I would like to propose a new approach to this problem.', 3, 4),
('b0000004-0000-0000-0000-000000000004', '추후 논의하면 좋겠습니다', 'I would like to discuss this further', '아이 우드 라이크 투 디스커스 디스 퍼더', 'I would like to discuss this further at your convenience.', 3, 5),
('b0000004-0000-0000-0000-000000000004', '확인 후 연락드리겠습니다', 'I will get back to you after checking', '아이 윌 겟 백 투유 애프터 체킹', 'I will get back to you after checking with my team.', 2, 6),
('b0000004-0000-0000-0000-000000000004', '양해 부탁드립니다', 'I appreciate your understanding', '아이 어프리시에이트 유어 언더스탠딩', 'I appreciate your understanding regarding this matter.', 3, 7),
('b0000004-0000-0000-0000-000000000004', '의견을 여쭤봐도 될까요?', 'May I ask for your opinion?', '메이 아이 아스크 포 유어 오피니언', 'May I ask for your opinion on this proposal?', 3, 8),
('b0000004-0000-0000-0000-000000000004', '다음 단계로 진행해도 될까요?', 'Shall we proceed to the next step?', '쉘 위 프로씨드 투 더 넥스트 스텝', 'Shall we proceed to the next step of our discussion?', 3, 9),
('b0000004-0000-0000-0000-000000000004', '빠른 답변 부탁드립니다', 'I would appreciate a prompt response', '아이 우드 어프리시에이트 어 프람트 리스판스', 'I would appreciate a prompt response at your earliest convenience.', 3, 10),
('b0000004-0000-0000-0000-000000000004', '협조에 감사드립니다', 'Thank you for your cooperation', '땡큐 포 유어 코오퍼레이션', 'Thank you for your cooperation on this project.', 2, 11),
('b0000004-0000-0000-0000-000000000004', '첨부 파일 확인 부탁드립니다', 'Please find the attached file', '플리즈 파인드 디 어태치드 파일', 'Please find the attached file for your review.', 2, 12),
('b0000004-0000-0000-0000-000000000004', '좋은 하루 되세요', 'I hope you have a wonderful day', '아이 홉 유 해브 어 원더풀 데이', 'I hope you have a wonderful day ahead.', 2, 13),
('b0000004-0000-0000-0000-000000000004', '질문이 있으시면 연락주세요', 'Please do not hesitate to contact me', '플리즈 두 낫 헤지테이트 투 컨택 미', 'Please do not hesitate to contact me if you have any questions.', 3, 14),
('b0000004-0000-0000-0000-000000000004', '기대하고 있겠습니다', 'I look forward to hearing from you', '아이 룩 포워드 투 히어링 프롬 유', 'I look forward to hearing from you soon.', 3, 15);

-- ============================================
-- 5. 어른/윗사람에게 (Speaking to Elders)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000005-0000-0000-0000-000000000005',
  '🙏 어른께 말씀드릴 때',
  '부모님, 어른에게 예의 바르게 말하는 표현',
  true,
  'target_elder',
  '🙏'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000005-0000-0000-0000-000000000005', '건강하세요?', 'How are you feeling?', '하우 아유 필링', 'How are you feeling? I hope you''re well.', 1, 1),
('b0000005-0000-0000-0000-000000000005', '식사하셨어요?', 'Have you eaten?', '해브 유 이튼', 'Have you eaten? Can I get you something?', 1, 2),
('b0000005-0000-0000-0000-000000000005', '편찮으신 데는 없으세요?', 'Are you feeling alright?', '아유 필링 올롸잇', 'Are you feeling alright? You look a bit tired.', 2, 3),
('b0000005-0000-0000-0000-000000000005', '도움이 필요하시면 말씀하세요', 'Please let me know if you need anything', '플리즈 렛 미 노 이프 유 니드 애니띵', 'Please let me know if you need anything.', 2, 4),
('b0000005-0000-0000-0000-000000000005', '제가 도와드릴까요?', 'May I help you with that?', '메이 아이 헬프 유 위드 댓', 'May I help you with that? Let me carry it for you.', 2, 5),
('b0000005-0000-0000-0000-000000000005', '늦어서 죄송합니다', 'I apologize for being late', '아이 아폴로자이즈 포 빙 레이트', 'I apologize for being late. Traffic was terrible.', 2, 6),
('b0000005-0000-0000-0000-000000000005', '좋은 말씀 감사합니다', 'Thank you for your kind words', '땡큐 포 유어 카인드 워즈', 'Thank you for your kind words. I really appreciate it.', 2, 7),
('b0000005-0000-0000-0000-000000000005', '다음에 뵙겠습니다', 'I look forward to seeing you again', '아이 룩 포워드 투 씨잉 유 어겐', 'I look forward to seeing you again soon.', 2, 8),
('b0000005-0000-0000-0000-000000000005', '오래오래 건강하세요', 'Please stay healthy', '플리즈 스테이 헬띠', 'Please stay healthy. Take good care of yourself.', 2, 9),
('b0000005-0000-0000-0000-000000000005', '덕분에 잘 지내고 있어요', 'Thanks to you, I''m doing well', '땡스 투 유 아임 두잉 웰', 'Thanks to you, I''m doing well.', 2, 10),
('b0000005-0000-0000-0000-000000000005', '조언 감사드립니다', 'Thank you for your advice', '땡큐 포 유어 어드바이스', 'Thank you for your advice. It really helped.', 2, 11),
('b0000005-0000-0000-0000-000000000005', '항상 감사하게 생각해요', 'I''m always grateful', '아임 올웨이즈 그레이트풀', 'I''m always grateful for everything you do.', 2, 12),
('b0000005-0000-0000-0000-000000000005', '안녕히 계세요', 'Please take care', '플리즈 테이크 케어', 'Please take care. I''ll visit again soon.', 1, 13),
('b0000005-0000-0000-0000-000000000005', '뭐 필요한 거 없으세요?', 'Is there anything you need?', '이즈 데어 애니띵 유 니드', 'Is there anything you need? I can pick it up for you.', 2, 14),
('b0000005-0000-0000-0000-000000000005', '말씀 잘 새겨듣겠습니다', 'I will keep your words in mind', '아이 윌 킵 유어 워즈 인 마인드', 'I will keep your words in mind. Thank you.', 3, 15);

-- ============================================
-- 6. 쇼핑할 때 (Shopping)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000006-0000-0000-0000-000000000006',
  '🛍️ 쇼핑할 때',
  '가게나 온라인에서 쇼핑할 때 유용한 표현',
  true,
  'situation_shopping',
  '🛍️'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000006-0000-0000-0000-000000000006', '이거 얼마예요?', 'How much is this?', '하우 머치 이즈 디스', 'Excuse me, how much is this?', 1, 1),
('b0000006-0000-0000-0000-000000000006', '그냥 구경하는 거예요', 'I''m just looking', '아임 저스트 루킹', 'I''m just looking, thank you.', 1, 2),
('b0000006-0000-0000-0000-000000000006', '다른 색상 있어요?', 'Do you have this in another color?', '두유 해브 디스 인 어나더 컬러', 'Do you have this in another color? Maybe blue?', 2, 3),
('b0000006-0000-0000-0000-000000000006', '입어봐도 돼요?', 'Can I try this on?', '캔 아이 트라이 디스 온', 'Can I try this on? Where is the fitting room?', 1, 4),
('b0000006-0000-0000-0000-000000000006', '카드로 결제할게요', 'I''ll pay by card', '아일 페이 바이 카드', 'I''ll pay by card. Can I use this one?', 1, 5),
('b0000006-0000-0000-0000-000000000006', '환불 가능한가요?', 'Can I get a refund?', '캔 아이 겟 어 리펀드', 'Can I get a refund? It doesn''t fit.', 2, 6),
('b0000006-0000-0000-0000-000000000006', '교환 가능한가요?', 'Can I exchange this?', '캔 아이 익스체인지 디스', 'Can I exchange this for a larger size?', 2, 7),
('b0000006-0000-0000-0000-000000000006', '세일 중인가요?', 'Is this on sale?', '이즈 디스 온 세일', 'Is this on sale? I saw a sign outside.', 1, 8),
('b0000006-0000-0000-0000-000000000006', '영수증 주세요', 'Can I have a receipt?', '캔 아이 해브 어 리싯', 'Can I have a receipt, please?', 1, 9),
('b0000006-0000-0000-0000-000000000006', '봉투 필요해요', 'I need a bag', '아이 니드 어 백', 'I need a bag, please. A bigger one if possible.', 1, 10),
('b0000006-0000-0000-0000-000000000006', '이거 재고 있어요?', 'Do you have this in stock?', '두유 해브 디스 인 스탁', 'Do you have this in stock? In size medium?', 2, 11),
('b0000006-0000-0000-0000-000000000006', '좀 더 저렴한 거 있어요?', 'Do you have anything cheaper?', '두유 해브 애니띵 칩퍼', 'Do you have anything cheaper? This is over my budget.', 2, 12),
('b0000006-0000-0000-0000-000000000006', '추천해 주세요', 'What do you recommend?', '왓 두유 레커멘드', 'What do you recommend? I''m looking for a gift.', 2, 13),
('b0000006-0000-0000-0000-000000000006', '포장해 주세요', 'Can you gift wrap this?', '캔유 기프트 랩 디스', 'Can you gift wrap this? It''s a present.', 2, 14),
('b0000006-0000-0000-0000-000000000006', '생각 좀 해볼게요', 'Let me think about it', '렛 미 띵크 어바웃 잇', 'Let me think about it. I''ll come back later.', 1, 15);

-- ============================================
-- 7. 여행/길 물어볼 때 (Travel & Directions)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000007-0000-0000-0000-000000000007',
  '✈️ 여행 & 길 물어볼 때',
  '해외 여행이나 길을 물어볼 때 필요한 표현',
  true,
  'situation_travel',
  '✈️'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000007-0000-0000-0000-000000000007', '화장실이 어디예요?', 'Where is the restroom?', '웨어 이즈 더 레스트룸', 'Excuse me, where is the restroom?', 1, 1),
('b0000007-0000-0000-0000-000000000007', '여기서 멀어요?', 'Is it far from here?', '이즈 잇 파 프럼 히어', 'Is it far from here? Can I walk?', 1, 2),
('b0000007-0000-0000-0000-000000000007', '지도 좀 보여주실 수 있어요?', 'Could you show me on the map?', '쿠쥬 쇼 미 온 더 맵', 'Could you show me on the map where it is?', 2, 3),
('b0000007-0000-0000-0000-000000000007', '택시 타는 곳이 어디예요?', 'Where can I catch a taxi?', '웨어 캔 아이 캐치 어 택시', 'Where can I catch a taxi around here?', 2, 4),
('b0000007-0000-0000-0000-000000000007', '얼마나 걸려요?', 'How long does it take?', '하우 롱 더즈 잇 테이크', 'How long does it take to get there?', 1, 5),
('b0000007-0000-0000-0000-000000000007', '이 버스가 거기 가요?', 'Does this bus go there?', '더즈 디스 버스 고 데어', 'Does this bus go to the city center?', 1, 6),
('b0000007-0000-0000-0000-000000000007', '길을 잃었어요', 'I''m lost', '아임 로스트', 'I''m lost. Can you help me?', 1, 7),
('b0000007-0000-0000-0000-000000000007', '체크인 부탁드립니다', 'I''d like to check in', '아이드 라이크 투 체크 인', 'I''d like to check in. I have a reservation.', 2, 8),
('b0000007-0000-0000-0000-000000000007', '와이파이 비밀번호가 뭐예요?', 'What''s the wifi password?', '왓츠 더 와이파이 패스워드', 'What''s the wifi password? I can''t connect.', 1, 9),
('b0000007-0000-0000-0000-000000000007', '짐 좀 맡아주실 수 있어요?', 'Can you keep my luggage?', '캔유 킵 마이 러기지', 'Can you keep my luggage for a few hours?', 2, 10),
('b0000007-0000-0000-0000-000000000007', '여기가 맞아요?', 'Is this the right place?', '이즈 디스 더 롸잇 플레이스', 'Is this the right place? I''m looking for the museum.', 1, 11),
('b0000007-0000-0000-0000-000000000007', '사진 좀 찍어주시겠어요?', 'Could you take a picture of me?', '쿠쥬 테이크 어 픽쳐 오브 미', 'Could you take a picture of me? Thank you!', 2, 12),
('b0000007-0000-0000-0000-000000000007', '예약했는데요', 'I have a reservation', '아이 해브 어 리저베이션', 'I have a reservation under Kim.', 2, 13),
('b0000007-0000-0000-0000-000000000007', '한국어 하시는 분 계세요?', 'Does anyone speak Korean?', '더즈 애니원 스픽 코리안', 'Does anyone speak Korean? I need some help.', 2, 14),
('b0000007-0000-0000-0000-000000000007', '가장 가까운 역이 어디예요?', 'Where is the nearest station?', '웨어 이즈 더 니어리스트 스테이션', 'Where is the nearest subway station?', 2, 15);

-- ============================================
-- 8. 카페/음료 주문 (Cafe & Drinks)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000008-0000-0000-0000-000000000008',
  '☕ 카페에서 주문하기',
  '카페에서 음료를 주문하고 대화하는 표현',
  true,
  'situation_cafe',
  '☕'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000008-0000-0000-0000-000000000008', '아메리카노 하나요', 'One Americano, please', '원 아메리카노 플리즈', 'One Americano, please. Iced.', 1, 1),
('b0000008-0000-0000-0000-000000000008', '여기서 먹고 갈게요', 'For here, please', '포 히어 플리즈', 'For here, please. I''ll sit over there.', 1, 2),
('b0000008-0000-0000-0000-000000000008', '포장이요', 'To go, please', '투 고 플리즈', 'To go, please. I''m in a hurry.', 1, 3),
('b0000008-0000-0000-0000-000000000008', '얼음 적게 넣어주세요', 'Light ice, please', '라이트 아이스 플리즈', 'Light ice, please. I don''t like too much ice.', 1, 4),
('b0000008-0000-0000-0000-000000000008', '샷 추가해 주세요', 'Extra shot, please', '엑스트라 샷 플리즈', 'Extra shot, please. I need more caffeine.', 2, 5),
('b0000008-0000-0000-0000-000000000008', '디카페인으로 할게요', 'Decaf, please', '디캐프 플리즈', 'Decaf, please. I''m trying to cut back on caffeine.', 2, 6),
('b0000008-0000-0000-0000-000000000008', '우유 대신 두유로요', 'With soy milk instead', '위드 소이 밀크 인스테드', 'With soy milk instead. I''m lactose intolerant.', 2, 7),
('b0000008-0000-0000-0000-000000000008', '메뉴 좀 볼게요', 'Can I see the menu?', '캔 아이 씨 더 메뉴', 'Can I see the menu? I''m not sure what to get.', 1, 8),
('b0000008-0000-0000-0000-000000000008', '추천 뭐예요?', 'What do you recommend?', '왓 두유 레커멘드', 'What do you recommend? I like sweet drinks.', 1, 9),
('b0000008-0000-0000-0000-000000000008', '이거랑 이거요', 'This one and this one', '디스 원 앤 디스 원', 'This one and this one, please.', 1, 10),
('b0000008-0000-0000-0000-000000000008', '사이즈 뭐로 할까요?', 'What size?', '왓 사이즈', 'What size would you like? Small, medium, or large?', 1, 11),
('b0000008-0000-0000-0000-000000000008', '라지 사이즈요', 'Large, please', '라지 플리즈', 'Large, please. I''m really thirsty.', 1, 12),
('b0000008-0000-0000-0000-000000000008', '설탕 빼주세요', 'No sugar, please', '노 슈가 플리즈', 'No sugar, please. Just black.', 1, 13),
('b0000008-0000-0000-0000-000000000008', '휘핑크림 올려주세요', 'With whipped cream, please', '위드 윕트 크림 플리즈', 'With whipped cream, please. Extra if possible!', 2, 14),
('b0000008-0000-0000-0000-000000000008', '몇 분 걸려요?', 'How long will it take?', '하우 롱 윌 잇 테이크', 'How long will it take? I''m in a bit of a rush.', 1, 15);

-- ============================================
-- 9. 감정 표현 확장 (Emotions Extended)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000009-0000-0000-0000-000000000009',
  '💭 다양한 감정 표현',
  '기쁨, 슬픔, 걱정, 흥분 등 다양한 감정을 표현하는 방법',
  true,
  'topic_emotion',
  '💭'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000009-0000-0000-0000-000000000009', '너무 기대돼!', 'I''m so excited!', '아임 쏘 익사이티드', 'I''m so excited! I can''t wait!', 1, 1),
('b0000009-0000-0000-0000-000000000009', '걱정돼', 'I''m worried', '아임 워리드', 'I''m worried about the exam tomorrow.', 1, 2),
('b0000009-0000-0000-0000-000000000009', '짜증나', 'I''m annoyed', '아임 어노이드', 'I''m annoyed. Nothing is going right today.', 1, 3),
('b0000009-0000-0000-0000-000000000009', '감동받았어', 'I''m touched', '아임 터치드', 'I''m touched. That was so thoughtful of you.', 2, 4),
('b0000009-0000-0000-0000-000000000009', '지루해', 'I''m bored', '아임 보어드', 'I''m bored. Let''s do something fun.', 1, 5),
('b0000009-0000-0000-0000-000000000009', '긴장돼', 'I''m nervous', '아임 너버스', 'I''m nervous about the presentation.', 1, 6),
('b0000009-0000-0000-0000-000000000009', '뿌듯해', 'I''m proud of myself', '아임 프라우드 오브 마이셀프', 'I''m proud of myself. I worked hard for this.', 2, 7),
('b0000009-0000-0000-0000-000000000009', '속상해', 'I''m upset', '아임 업셋', 'I''m upset. I didn''t expect that to happen.', 1, 8),
('b0000009-0000-0000-0000-000000000009', '놀랐어!', 'I''m surprised!', '아임 서프라이즈드', 'I''m surprised! I didn''t see that coming.', 1, 9),
('b0000009-0000-0000-0000-000000000009', '답답해', 'I''m frustrated', '아임 프러스트레이티드', 'I''m frustrated. This isn''t working.', 2, 10),
('b0000009-0000-0000-0000-000000000009', '안심이야', 'I''m relieved', '아임 릴리브드', 'I''m relieved. Everything worked out fine.', 2, 11),
('b0000009-0000-0000-0000-000000000009', '부러워', 'I''m jealous', '아임 젤러스', 'I''m jealous! That looks amazing.', 1, 12),
('b0000009-0000-0000-0000-000000000009', '미안해서 어떡해', 'I feel so bad', '아이 필 쏘 배드', 'I feel so bad about what happened.', 2, 13),
('b0000009-0000-0000-0000-000000000009', '설레', 'I''m thrilled', '아임 뜨릴드', 'I''m thrilled about the trip next week.', 2, 14),
('b0000009-0000-0000-0000-000000000009', '황당해', 'I''m speechless', '아임 스피치리스', 'I''m speechless. I can''t believe they did that.', 2, 15);

-- ============================================
-- 10. 사과와 감사 (Apologies & Thanks)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000010-0000-0000-0000-000000000010',
  '🙇 사과와 감사',
  '진심을 담아 사과하고 감사를 전하는 표현',
  true,
  'topic_courtesy',
  '🙇'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000010-0000-0000-0000-000000000010', '정말 고마워', 'Thanks so much', '땡스 쏘 머치', 'Thanks so much for helping me out.', 1, 1),
('b0000010-0000-0000-0000-000000000010', '덕분이야', 'Thanks to you', '땡스 투 유', 'Thanks to you, everything went well.', 1, 2),
('b0000010-0000-0000-0000-000000000010', '미안, 내 잘못이야', 'Sorry, my bad', '쏘리, 마이 배드', 'Sorry, my bad. I should have been more careful.', 1, 3),
('b0000010-0000-0000-0000-000000000010', '진심으로 사과해', 'I sincerely apologize', '아이 신시어리 어폴로자이즈', 'I sincerely apologize for the inconvenience.', 3, 4),
('b0000010-0000-0000-0000-000000000010', '어떻게 감사해야 할지 모르겠어', 'I can''t thank you enough', '아이 캔트 땡큐 이너프', 'I can''t thank you enough for everything.', 2, 5),
('b0000010-0000-0000-0000-000000000010', '실례가 됐다면 죄송해요', 'I''m sorry if I offended you', '아임 쏘리 이프 아이 오펜디드 유', 'I''m sorry if I offended you. That wasn''t my intention.', 3, 6),
('b0000010-0000-0000-0000-000000000010', '신세 많이 졌습니다', 'I owe you one', '아이 오 유 원', 'I owe you one. Let me buy you lunch.', 2, 7),
('b0000010-0000-0000-0000-000000000010', '기다리게 해서 미안해', 'Sorry for keeping you waiting', '쏘리 포 키핑 유 웨이팅', 'Sorry for keeping you waiting. I got stuck in traffic.', 2, 8),
('b0000010-0000-0000-0000-000000000010', '네 도움이 정말 컸어', 'Your help meant a lot', '유어 헬프 멘트 어 랏', 'Your help meant a lot to me.', 2, 9),
('b0000010-0000-0000-0000-000000000010', '다시는 안 그럴게', 'It won''t happen again', '잇 원트 해픈 어겐', 'It won''t happen again. I promise.', 2, 10),
('b0000010-0000-0000-0000-000000000010', '오해가 있었나 봐', 'There must have been a misunderstanding', '데어 머스트 해브 빈 어 미스언더스탠딩', 'There must have been a misunderstanding. Let me explain.', 3, 11),
('b0000010-0000-0000-0000-000000000010', '항상 고맙게 생각해', 'I''m always grateful', '아임 올웨이즈 그레이트풀', 'I''m always grateful for your support.', 2, 12),
('b0000010-0000-0000-0000-000000000010', '늦어서 정말 미안', 'I''m really sorry I''m late', '아임 리얼리 쏘리 아임 레이트', 'I''m really sorry I''m late. I missed my bus.', 1, 13),
('b0000010-0000-0000-0000-000000000010', '용서해 줄 수 있어?', 'Can you forgive me?', '캔유 포기브 미', 'Can you forgive me? I didn''t mean to hurt you.', 2, 14),
('b0000010-0000-0000-0000-000000000010', '갚을 길이 없네', 'I don''t know how to repay you', '아이 돈노 하우 투 리페이 유', 'I don''t know how to repay you for your kindness.', 3, 15);

-- ============================================
-- 11. 전화 통화 (Phone Calls)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000011-0000-0000-0000-000000000011',
  '📞 전화 통화',
  '전화로 대화할 때 사용하는 표현',
  true,
  'situation_phone',
  '📞'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000011-0000-0000-0000-000000000011', '여보세요', 'Hello?', '헬로', 'Hello? Who is this?', 1, 1),
('b0000011-0000-0000-0000-000000000011', '지금 통화 가능해요?', 'Is this a good time to talk?', '이즈 디스 어 굿 타임 투 톡', 'Is this a good time to talk? I have a quick question.', 2, 2),
('b0000011-0000-0000-0000-000000000011', '잠깐만요', 'Hold on a second', '홀드 온 어 세컨드', 'Hold on a second. Let me check.', 1, 3),
('b0000011-0000-0000-0000-000000000011', '잘 안 들려요', 'I can''t hear you well', '아이 캔트 히어 유 웰', 'I can''t hear you well. Can you speak louder?', 1, 4),
('b0000011-0000-0000-0000-000000000011', '다시 전화할게요', 'I''ll call you back', '아일 콜유 백', 'I''ll call you back in 5 minutes.', 1, 5),
('b0000011-0000-0000-0000-000000000011', '메시지 남겨주세요', 'Please leave a message', '플리즈 리브 어 메시지', 'I''m not available right now. Please leave a message.', 2, 6),
('b0000011-0000-0000-0000-000000000011', '전화 끊지 마세요', 'Please don''t hang up', '플리즈 돈트 행 업', 'Please don''t hang up. I need to transfer you.', 2, 7),
('b0000011-0000-0000-0000-000000000011', '번호 잘못 거셨어요', 'You have the wrong number', '유 해브 더 롱 넘버', 'Sorry, you have the wrong number.', 1, 8),
('b0000011-0000-0000-0000-000000000011', '연결이 끊겼어요', 'We got disconnected', '위 갓 디스커넥티드', 'We got disconnected. Can you hear me now?', 2, 9),
('b0000011-0000-0000-0000-000000000011', '누구세요?', 'Who is calling?', '후 이즈 콜링', 'Who is calling? May I ask who''s calling?', 1, 10),
('b0000011-0000-0000-0000-000000000011', '바꿔드릴게요', 'I''ll put you through', '아일 풋 유 쓰루', 'I''ll put you through to the manager.', 2, 11),
('b0000011-0000-0000-0000-000000000011', '전화해줘서 고마워', 'Thanks for calling', '땡스 포 콜링', 'Thanks for calling! It was nice to hear from you.', 1, 12),
('b0000011-0000-0000-0000-000000000011', '지금 회의 중이에요', 'I''m in a meeting right now', '아임 인 어 미팅 롸잇 나우', 'I''m in a meeting right now. Can I call you later?', 2, 13),
('b0000011-0000-0000-0000-000000000011', '배터리가 거의 없어요', 'My battery is almost dead', '마이 배터리 이즈 올모스트 데드', 'My battery is almost dead. I''ll text you.', 2, 14),
('b0000011-0000-0000-0000-000000000011', '문자 보낼게', 'I''ll text you', '아일 텍스트 유', 'I''ll text you the details later.', 1, 15);

-- ============================================
-- 12. 약속/계획 잡기 (Making Plans)
-- ============================================

INSERT INTO oh_my_english.vocabulary_books (id, title, description, is_system, category, cover_emoji)
VALUES (
  'b0000012-0000-0000-0000-000000000012',
  '📅 약속 잡기',
  '친구나 동료와 약속을 잡고 일정을 조율하는 표현',
  true,
  'topic_plans',
  '📅'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO oh_my_english.vocabulary_items (book_id, korean_expression, english_expression, pronunciation_guide, context_explanation, difficulty_level, order_index) VALUES
('b0000012-0000-0000-0000-000000000012', '이번 주말에 시간 돼?', 'Are you free this weekend?', '아유 프리 디스 위켄드', 'Are you free this weekend? Let''s hang out.', 1, 1),
('b0000012-0000-0000-0000-000000000012', '언제가 좋아?', 'When works for you?', '웬 워크스 포 유', 'When works for you? I''m flexible.', 1, 2),
('b0000012-0000-0000-0000-000000000012', '토요일 3시 어때?', 'How about Saturday at 3?', '하우 어바웃 새터데이 앳 쓰리', 'How about Saturday at 3? We could grab lunch.', 1, 3),
('b0000012-0000-0000-0000-000000000012', '그때는 안 될 것 같아', 'I don''t think I can make it then', '아이 돈띵 아이 캔 메이킷 덴', 'I don''t think I can make it then. How about Sunday?', 2, 4),
('b0000012-0000-0000-0000-000000000012', '일정 변경해도 될까?', 'Can we reschedule?', '캔위 리스케줄', 'Can we reschedule? Something came up.', 2, 5),
('b0000012-0000-0000-0000-000000000012', '어디서 만날까?', 'Where should we meet?', '웨어 슈드 위 밋', 'Where should we meet? How about the usual place?', 1, 6),
('b0000012-0000-0000-0000-000000000012', '역 앞에서 보자', 'Let''s meet in front of the station', '렛츠 밋 인 프론트 오브 더 스테이션', 'Let''s meet in front of the station at noon.', 2, 7),
('b0000012-0000-0000-0000-000000000012', '거기 가본 적 있어?', 'Have you been there before?', '해브 유 빈 데어 비포', 'Have you been there before? It''s really nice.', 1, 8),
('b0000012-0000-0000-0000-000000000012', '예약해둘게', 'I''ll make a reservation', '아일 메이크 어 리저베이션', 'I''ll make a reservation. How many people?', 2, 9),
('b0000012-0000-0000-0000-000000000012', '늦으면 연락해', 'Let me know if you''re running late', '렛 미 노 이프 유어 러닝 레이트', 'Let me know if you''re running late.', 2, 10),
('b0000012-0000-0000-0000-000000000012', '먼저 가 있을게', 'I''ll be there first', '아일 비 데어 퍼스트', 'I''ll be there first. Take your time.', 1, 11),
('b0000012-0000-0000-0000-000000000012', '취소해야 할 것 같아', 'I might have to cancel', '아이 마이트 해브 투 캔슬', 'I might have to cancel. I''m not feeling well.', 2, 12),
('b0000012-0000-0000-0000-000000000012', '다음에 다시 잡자', 'Let''s do it another time', '렛츠 두 잇 어나더 타임', 'Let''s do it another time. This week is crazy.', 1, 13),
('b0000012-0000-0000-0000-000000000012', '확정이야?', 'Is it confirmed?', '이즈 잇 컨펌드', 'Is it confirmed? Should I block my calendar?', 2, 14),
('b0000012-0000-0000-0000-000000000012', '그때 보자!', 'See you then!', '씨유 덴', 'See you then! I''m looking forward to it.', 1, 15);

-- Update expression_count for all new books
UPDATE oh_my_english.vocabulary_books SET expression_count = (
  SELECT COUNT(*) FROM oh_my_english.vocabulary_items WHERE book_id = vocabulary_books.id
) WHERE id::text LIKE 'b0000%';

-- Summary: 12 new vocabulary books with 180 expressions total
-- Categories covered:
-- - Target: child, friend, coworker, elder
-- - Situation: formal, shopping, travel, cafe, phone
-- - Topic: emotion, courtesy, plans
