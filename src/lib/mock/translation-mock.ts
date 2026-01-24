/**
 * Mock 번역 데이터 - API 연결 없이 테스트용
 */

import type { TranslationResult } from '@/domain/entities/translation'
import type { TargetType, SituationType } from '@/presentation/components/TranslationInput'

interface MockTranslationData {
  mainExpression: {
    english: string
    formality: 'casual' | 'neutral' | 'formal'
    targetAudience?: string
  }
  explanation: {
    context: string
    nuance: string
    culturalNote?: string
  }
  alternatives: Array<{
    expression: string
    situation: string
    difference: string
    formality?: 'casual' | 'neutral' | 'formal'
    targetAudience?: string
  }>
  relatedVocabulary: Array<{
    word: string
    meaning: string
    partOfSpeech: string
    exampleSentence: string
  }>
}

// 대상 + 상황별 Mock 데이터
const MOCK_RESPONSES: Record<string, Record<TargetType, Record<SituationType, MockTranslationData>>> = {
  // "밥 먹었어?" 관련
  '밥': {
    child: {
      casual: {
        mainExpression: {
          english: "Did you eat yet, sweetie?",
          formality: 'casual',
        },
        explanation: {
          context: "아이에게 부드럽게 물어볼 때 쓰는 표현이에요.",
          nuance: "'sweetie'는 아이에게 애정을 담아 부르는 호칭입니다. 친근하고 따뜻한 느낌을 줍니다.",
          culturalNote: "영어권에서는 아이에게 'sweetie', 'honey', 'dear' 같은 호칭을 자주 사용해요.",
        },
        alternatives: [
          { expression: "Have you had your meal?", situation: "조금 더 정중하게", difference: "격식있는 표현으로, 선생님이 학생에게 물을 때도 적합해요." },
          { expression: "Did you finish eating?", situation: "다 먹었는지 확인할 때", difference: "음식을 다 비웠는지 확인하는 뉘앙스가 있어요." },
        ],
        relatedVocabulary: [
          { word: "sweetie", meaning: "자기야, 귀염둥이", partOfSpeech: "명사", exampleSentence: "Come here, sweetie!" },
          { word: "meal", meaning: "식사", partOfSpeech: "명사", exampleSentence: "It's time for your meal." },
        ],
      },
      formal: {
        mainExpression: {
          english: "Have you had your meal?",
          formality: 'formal',
        },
        explanation: {
          context: "아이에게도 격식을 차려서 물어볼 때 사용해요.",
          nuance: "선생님이 학생에게 묻는 느낌입니다.",
        },
        alternatives: [
          { expression: "Did you eat your lunch?", situation: "점심 식사 확인", difference: "구체적으로 점심을 물어볼 때 사용해요." },
        ],
        relatedVocabulary: [
          { word: "meal", meaning: "식사", partOfSpeech: "명사", exampleSentence: "Did you enjoy your meal?" },
        ],
      },
    },
    adult: {
      casual: {
        mainExpression: {
          english: "Have you eaten?",
          formality: 'casual',
        },
        explanation: {
          context: "가장 자연스러운 일상 표현이에요.",
          nuance: "친구나 가족에게 편하게 물어볼 때 씁니다. 안부 인사처럼 가볍게 쓸 수 있어요.",
          culturalNote: "한국의 '밥 먹었어?'처럼 영어권에서도 식사 여부를 묻는 건 친근함의 표현이에요.",
        },
        alternatives: [
          { expression: "Did you eat?", situation: "더 캐주얼하게", difference: "현재완료 대신 과거형을 써서 더 간단한 표현" },
          { expression: "Have you had anything to eat?", situation: "뭔가 먹었는지 확인", difference: "무엇이든 먹었는지 물어볼 때 사용해요." },
          { expression: "You hungry?", situation: "매우 캐주얼, 친한 사이", difference: "주어를 생략한 아주 편한 표현이에요." },
        ],
        relatedVocabulary: [
          { word: "grab a bite", meaning: "간단히 먹다", partOfSpeech: "동사구", exampleSentence: "Let's grab a bite." },
          { word: "starving", meaning: "배고파 죽겠는", partOfSpeech: "형용사", exampleSentence: "I'm starving!" },
        ],
      },
      formal: {
        mainExpression: {
          english: "Have you had a chance to eat?",
          formality: 'formal',
        },
        explanation: {
          context: "격식있게 식사 여부를 물어보는 표현이에요.",
          nuance: "비즈니스 상황에서도 사용 가능합니다. 상대방을 배려하는 느낌이 있어요.",
        },
        alternatives: [
          { expression: "Have you dined yet?", situation: "매우 격식있는 상황", difference: "'dine'은 'eat'보다 격식있는 단어예요." },
        ],
        relatedVocabulary: [
          { word: "dine", meaning: "식사하다 (격식)", partOfSpeech: "동사", exampleSentence: "Would you like to dine with us?" },
        ],
      },
    },
    colleague: {
      casual: {
        mainExpression: {
          english: "Have you eaten yet?",
          formality: 'casual',
        },
        explanation: {
          context: "동료에게 자연스럽게 점심 먹었는지 물어볼 때 쓰는 표현이에요.",
          nuance: "친근하면서도 적절한 거리감을 유지하는 표현입니다.",
        },
        alternatives: [
          { expression: "Did you grab lunch?", situation: "점심 먹었냐고 물을 때", difference: "'grab'은 빠르게 먹는 느낌을 줘요." },
          { expression: "Wanna grab something to eat?", situation: "같이 먹자는 뉘앙스", difference: "함께 식사하자는 제안의 의미도 담겨있어요." },
        ],
        relatedVocabulary: [
          { word: "grab lunch", meaning: "점심 먹다", partOfSpeech: "동사구", exampleSentence: "Let's grab lunch together." },
        ],
      },
      formal: {
        mainExpression: {
          english: "Have you had a chance to have lunch?",
          formality: 'formal',
        },
        explanation: {
          context: "격식있는 동료 관계에서 쓰는 표현이에요.",
          nuance: "바쁜 상황에서 상대방을 배려하는 느낌이 있어요.",
        },
        alternatives: [
          { expression: "Have you had your lunch break yet?", situation: "점심 시간 여부 확인", difference: "휴식 시간을 가졌는지 묻는 표현이에요." },
        ],
        relatedVocabulary: [
          { word: "lunch break", meaning: "점심 시간", partOfSpeech: "명사", exampleSentence: "I'll call you after my lunch break." },
        ],
      },
    },
    boss: {
      casual: {
        mainExpression: {
          english: "Have you eaten, sir/ma'am?",
          formality: 'neutral',
        },
        explanation: {
          context: "상사에게 캐주얼하게 물어볼 때도 존칭을 붙이는 게 좋아요.",
          nuance: "친근하면서도 예의를 갖춘 표현입니다.",
        },
        alternatives: [
          { expression: "Did you get a chance to eat?", situation: "바쁜 상사에게", difference: "상사가 바빠서 식사를 못했을 수 있다는 배려가 담겨있어요." },
        ],
        relatedVocabulary: [
          { word: "sir/ma'am", meaning: "선생님 (존칭)", partOfSpeech: "명사", exampleSentence: "Yes, sir." },
        ],
      },
      formal: {
        mainExpression: {
          english: "Have you had a chance to dine?",
          formality: 'formal',
        },
        explanation: {
          context: "상사에게 매우 격식있게 물어볼 때 쓰는 표현이에요.",
          nuance: "공식적인 자리에서 적합한 표현입니다.",
        },
        alternatives: [
          { expression: "May I ask if you've had lunch?", situation: "더 공손한 표현", difference: "'May I ask'로 시작해서 더 정중한 느낌을 줘요." },
        ],
        relatedVocabulary: [
          { word: "dine", meaning: "식사하다", partOfSpeech: "동사", exampleSentence: "Where would you like to dine?" },
        ],
      },
    },
    stranger: {
      casual: {
        mainExpression: {
          english: "Have you eaten?",
          formality: 'casual',
        },
        explanation: {
          context: "처음 보는 사람에게도 가벼운 인사처럼 쓸 수 있어요.",
          nuance: "친근한 분위기를 만들고 싶을 때 사용합니다.",
        },
        alternatives: [
          { expression: "Had anything to eat?", situation: "가볍게 물어볼 때", difference: "Have you를 생략한 더 캐주얼한 표현이에요." },
        ],
        relatedVocabulary: [],
      },
      formal: {
        mainExpression: {
          english: "Have you had a chance to eat?",
          formality: 'formal',
        },
        explanation: {
          context: "처음 보는 사람에게 정중하게 물어볼 때 쓰는 표현이에요.",
          nuance: "상대방을 배려하는 예의 바른 표현입니다.",
        },
        alternatives: [
          { expression: "May I offer you something to eat?", situation: "음식을 권할 때", difference: "음식을 제공하겠다는 의미가 담겨있어요." },
        ],
        relatedVocabulary: [],
      },
    },
    friend: {
      casual: {
        mainExpression: {
          english: "You eat yet?",
          formality: 'casual',
        },
        explanation: {
          context: "친한 친구에게 편하게 물어보는 표현이에요.",
          nuance: "문법적으로 축약된 형태로, 매우 친근한 느낌을 줍니다.",
          culturalNote: "친한 사이에서는 문법을 생략해도 자연스러워요.",
        },
        alternatives: [
          { expression: "Did you eat?", situation: "좀 더 완전한 문장", difference: "같은 의미지만 조금 더 정확한 문장이에요." },
          { expression: "Hungry?", situation: "아주 짧게", difference: "배고프냐고 직접적으로 물어보는 표현이에요." },
          { expression: "Wanna eat?", situation: "같이 먹자는 뉘앙스", difference: "함께 식사하자는 제안이 담겨있어요." },
        ],
        relatedVocabulary: [
          { word: "starving", meaning: "배고파 죽겠는", partOfSpeech: "형용사", exampleSentence: "I'm starving, let's eat!" },
          { word: "grab food", meaning: "밥 먹다", partOfSpeech: "동사구", exampleSentence: "Let's grab some food." },
        ],
      },
      formal: {
        mainExpression: {
          english: "Have you had your meal?",
          formality: 'formal',
        },
        explanation: {
          context: "친구지만 격식있게 물어볼 때 (오랜만에 만났거나 특별한 상황)",
          nuance: "평소보다 조금 더 정중한 표현이에요.",
        },
        alternatives: [
          { expression: "Have you eaten yet?", situation: "일반적인 표현", difference: "가장 흔하게 쓰이는 표현이에요." },
        ],
        relatedVocabulary: [],
      },
    },
  },
}

// 기본 응답 (매칭되는 것이 없을 때)
const DEFAULT_RESPONSE: Record<SituationType, MockTranslationData> = {
  casual: {
    mainExpression: {
      english: "Here's a natural way to say it!",
      formality: 'casual',
    },
    explanation: {
      context: "입력하신 표현을 자연스러운 영어로 변환했어요.",
      nuance: "일상 대화에서 편하게 쓸 수 있는 표현입니다.",
    },
    alternatives: [
      { expression: "Alternative expression 1", situation: "다른 상황에서", difference: "다른 뉘앙스의 표현이에요." },
      { expression: "Alternative expression 2", situation: "또 다른 상황에서", difference: "또 다른 방식의 표현이에요." },
    ],
    relatedVocabulary: [
      { word: "example", meaning: "예시", partOfSpeech: "명사", exampleSentence: "This is an example." },
    ],
  },
  formal: {
    mainExpression: {
      english: "Here's a formal way to express this.",
      formality: 'formal',
    },
    explanation: {
      context: "격식있는 상황에서 사용할 수 있는 표현이에요.",
      nuance: "공식적인 자리에서 적합한 표현입니다.",
    },
    alternatives: [
      { expression: "Formal alternative", situation: "공식적인 상황에서", difference: "더 격식있는 표현이에요." },
    ],
    relatedVocabulary: [
      { word: "formal", meaning: "격식있는", partOfSpeech: "형용사", exampleSentence: "This is a formal setting." },
    ],
  },
}

/**
 * Mock 번역 결과 생성
 */
export function generateMockTranslation(
  koreanInput: string,
  target: TargetType,
  situation: SituationType
): TranslationResult {
  // 입력에서 키워드 찾기
  let mockData: MockTranslationData | null = null

  for (const [keyword, targetData] of Object.entries(MOCK_RESPONSES)) {
    if (koreanInput.includes(keyword)) {
      mockData = targetData[target]?.[situation] || null
      break
    }
  }

  // 매칭되는 것이 없으면 기본 응답
  if (!mockData) {
    mockData = DEFAULT_RESPONSE[situation]
  }

  // target에 따른 targetAudience 매핑
  const targetAudienceMap: Record<TargetType, string> = {
    child: '어린이',
    adult: '성인',
    colleague: '직장동료',
    boss: '상사',
    stranger: '처음 만난 사람',
    friend: '친구',
  }

  return {
    mainExpression: {
      ...mockData.mainExpression,
      targetAudience: mockData.mainExpression.targetAudience || targetAudienceMap[target],
    },
    explanation: mockData.explanation,
    alternatives: mockData.alternatives.map(alt => ({
      ...alt,
      formality: alt.formality || (situation === 'formal' ? 'formal' : 'casual'),
      targetAudience: alt.targetAudience || targetAudienceMap[target],
    })),
    relatedVocabulary: mockData.relatedVocabulary,
    category: situation === 'formal' ? '비즈니스' : '일상대화',
  }
}

/**
 * Mock 모드 활성화 여부
 */
export function isMockMode(): boolean {
  if (typeof window === 'undefined') {
    return process.env.ANTHROPIC_API_KEY === 'placeholder_api_key' ||
           !process.env.ANTHROPIC_API_KEY
  }
  return false
}
