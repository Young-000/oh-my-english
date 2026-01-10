export interface TranslationResult {
  mainExpression: {
    english: string
    formality: 'casual' | 'neutral' | 'formal'
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
  }>
  relatedVocabulary: Array<{
    word: string
    meaning: string
    partOfSpeech: string
    exampleSentence: string
  }>
  category: string
}

export interface LearningRecord {
  id: string
  userId: string
  koreanInput: string
  englishExpression: string
  contextExplanation: string
  alternatives: TranslationResult['alternatives']
  relatedVocabulary: TranslationResult['relatedVocabulary']
  category: string
  isBookmarked: boolean
  masteryLevel: number
  reviewCount: number
  nextReviewAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface QuizAttempt {
  id: string
  userId: string
  recordId: string
  quizType: 'korean_to_english' | 'fill_blank' | 'multiple_choice'
  question: string
  userAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  timeTakenMs: number | null
  createdAt: Date
}

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  settings: {
    dailyGoal: number
    preferredStyle: 'casual' | 'neutral' | 'formal'
    notificationEnabled: boolean
  }
  createdAt: Date
}
