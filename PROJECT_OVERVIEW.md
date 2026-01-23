# Project Overview

## 기본 정보
| 항목 | 내용 |
|------|------|
| **프로젝트명** | oh-my-english |
| **목적** | AI 기반 영어 학습 서비스 |
| **상태** | 🟡 개발 중 |
| **시작일** | - |
| **마지막 업데이트** | 2025-01-19 |

## 한 줄 요약
> AI(Claude)를 활용한 영어 학습 웹 애플리케이션

## 기술 스택
| 분류 | 기술 |
|------|------|
| Frontend | React, Next.js |
| Backend | Next.js API Routes |
| Database | Supabase |
| AI | @anthropic-ai/sdk (Claude) |
| UI | Radix UI, Lucide Icons |
| Styling | Tailwind CSS |
| Auth | @supabase/ssr |
| Language | TypeScript |
| Testing | E2E (Playwright) |

## 주요 기능
- AI 기반 영어 학습
- 맞춤형 학습 추천
- 학습 진도 추적
- 다크 모드 지원

## 아키텍처 개요
```
src/
├── app/          # Next.js App Router
├── components/   # UI 컴포넌트
│   └── ui/       # shadcn/ui 컴포넌트
├── lib/          # 라이브러리/유틸
└── ...
```

## 디렉토리 구조
```
oh-my-english/
├── e2e/               # E2E 테스트
├── public/            # 정적 파일
├── src/               # 소스 코드
└── supabase/          # Supabase 설정
```

## 최근 작업 내역
| 날짜 | 작업 내용 | 상태 |
|------|----------|------|
| - | 초기 설정 완료 | ✅ 완료 |

## 다음 할 일
- [ ] AI 학습 기능 고도화
- [ ] 사용자 피드백 반영

## 참고 사항
- Supabase 스키마: `oh_my_english`
- Anthropic Claude API 사용

---
*이 문서는 Claude Code Stop 훅에 의해 자동으로 업데이트됩니다.*
