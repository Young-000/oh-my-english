# Oh My English

AI 기반 영어 학습 서비스

## Overview

| 항목 | 값 |
|------|-----|
| **배포 URL** | https://oh-my-english.vercel.app |
| **Supabase** | Project 2 - `gtnqsbdlybrkbsgtecvy` |
| **Schema** | `oh_my_english` |
| **기술 스택** | Next.js + TypeScript |

## 진행상황

| 영역 | 상태 |
|------|:----:|
| Frontend | ✅ |
| Backend | ✅ (Next.js API Routes) |
| DB 연결 | ⏳ 스키마 미생성 |
| 배포 | ✅ |

## DB 테이블 (예정)

```sql
-- oh_my_english 스키마 사용 예정
oh_my_english.users
oh_my_english.lessons
oh_my_english.progress
```

## 환경 변수 (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://gtnqsbdlybrkbsgtecvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...  # Claude AI API
```

---

*전역 설정 참조: `workspace/CLAUDE.md`, `SUPABASE_RULES.md`*
