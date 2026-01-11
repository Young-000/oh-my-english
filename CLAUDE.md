# Oh My English

AI 기반 영어 학습 서비스

---

## 진행상황 체크리스트

| 영역 | 상태 | 배포 URL |
|------|:----:|----------|
| **Frontend** | ✅ | [oh-my-english.vercel.app](https://oh-my-english.vercel.app) |
| **Backend** | ✅ | Next.js API Routes |
| **DB 연결** | 🔧 | 스키마 미생성 |
| **배포** | ✅ | Vercel |

<details>
<summary>상세 체크리스트</summary>

### Frontend
- [x] 프로젝트 초기화 (Next.js)
- [x] TypeScript 설정
- [x] 환경 변수 (.env.local)

### Backend
- [x] Next.js API Routes
- [x] Claude AI API 연동

### DB 연결
- [x] Project 2 선택
- [ ] `oh_my_english` 스키마 생성
- [ ] 테이블 생성
- [ ] 클라이언트 `.schema()` 적용

### 배포
- [x] vercel.json
- [x] 환경 변수 (Vercel)
- [x] 프로덕션 배포

</details>

---

## Supabase 설정

> ⚠️ **필수 참조**: [`/SUPABASE_RULES.md`](/SUPABASE_RULES.md)

| 항목 | 값 |
|------|-----|
| **Project** | Project 2 (비게임) |
| **Project ID** | `gtnqsbdlybrkbsgtecvy` |
| **Schema** | `oh_my_english` |
| **URL** | `https://gtnqsbdlybrkbsgtecvy.supabase.co` |

## 기술 스택

- **Frontend**: Next.js + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)

## 개발 명령어

```bash
npm install    # 의존성 설치
npm run dev    # 개발 서버 (포트 3000)
npm run build  # 프로덕션 빌드
npm run lint   # 린트 실행
```

## 환경 변수

`.env.local`:
```env
# ===========================================
# Supabase Configuration - Project 2 (비게임)
# ===========================================
# Schema: oh_my_english

NEXT_PUBLIC_SUPABASE_URL=https://gtnqsbdlybrkbsgtecvy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Claude AI API
ANTHROPIC_API_KEY=sk-ant-...
```

## 테이블 구조

```sql
-- 모든 테이블은 oh_my_english 스키마에 생성
CREATE TABLE oh_my_english.users (...);
CREATE TABLE oh_my_english.lessons (...);
CREATE TABLE oh_my_english.progress (...);
-- 등
```

---

*이 프로젝트는 글로벌 규칙 `/CLAUDE.md` 및 `/SUPABASE_RULES.md`를 따릅니다.*
