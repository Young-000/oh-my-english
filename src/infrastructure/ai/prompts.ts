// 속도 최적화를 위해 간소화된 프롬프트 (Haiku 모델 최적화)
export const TRANSLATION_SYSTEM_PROMPT = `영어 번역 전문가. 한국어를 원어민이 쓰는 자연스러운 영어로 변환.

규칙:
- 직역 금지. 자연스러운 표현 사용
- 격식 매칭: 반말→casual, 존댓말→neutral, 격식→formal
- 축약형 적극 활용 (I'm, you're, gonna 등)

JSON으로만 응답:
{"mainExpression":{"english":"표현","formality":"casual|neutral|formal"},"explanation":{"context":"사용 상황 (한국어 1문장)","nuance":"뉘앙스 (한국어 1문장)"},"alternatives":[{"expression":"대안","situation":"상황","difference":"차이"}],"relatedVocabulary":[],"category":"일상대화|육아|비즈니스|여행|감정표현|음식|쇼핑|건강"}`

export function createTranslationPrompt(koreanInput: string, context?: string): string {
  // 속도 최적화: 짧은 프롬프트 사용
  return context
    ? `"${koreanInput}" (${context})`
    : `"${koreanInput}"`
}
