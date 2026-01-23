import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TranslateAndSaveUseCase } from './translate-and-save'
import type { ITranslationService } from '../repositories/translation-service'
import type { ILearningRecordRepository } from '../repositories/learning-record-repository'
import type { TranslationResult, LearningRecord } from '../entities/translation'

describe('TranslateAndSaveUseCase', () => {
  let useCase: TranslateAndSaveUseCase
  let mockTranslationService: ITranslationService
  let mockRepository: ILearningRecordRepository

  const mockTranslationResult: TranslationResult = {
    mainExpression: {
      english: 'What do you want to eat?',
      formality: 'casual',
    },
    explanation: {
      context: 'Used when asking a child what they want to eat',
      nuance: 'Casual and friendly tone',
    },
    alternatives: [
      {
        expression: 'What would you like to eat?',
        situation: 'More polite situations',
        difference: 'Slightly more formal',
      },
    ],
    relatedVocabulary: [
      {
        word: 'meal',
        meaning: '식사',
        partOfSpeech: 'noun',
        exampleSentence: 'Let\'s have a meal together.',
      },
    ],
    category: '일상대화',
  }

  const mockLearningRecord: LearningRecord = {
    id: 'record-1',
    userId: 'user-1',
    koreanInput: '아기한테 밥 뭐먹을래?',
    englishExpression: 'What do you want to eat?',
    contextExplanation: 'Used when asking a child what they want to eat',
    alternatives: mockTranslationResult.alternatives,
    relatedVocabulary: mockTranslationResult.relatedVocabulary,
    category: '일상대화',
    isBookmarked: false,
    masteryLevel: 0,
    reviewCount: 0,
    nextReviewAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    mockTranslationService = {
      translate: vi.fn().mockResolvedValue(mockTranslationResult),
    }

    mockRepository = {
      create: vi.fn().mockResolvedValue(mockLearningRecord),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdWithCount: vi.fn(),
      findDueForReview: vi.fn(),
      update: vi.fn(),
      updateMasteryLevel: vi.fn(),
      toggleBookmark: vi.fn(),
      delete: vi.fn(),
    }

    useCase = new TranslateAndSaveUseCase(mockTranslationService, mockRepository)
  })

  it('should translate Korean input and return result', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      koreanInput: '아기한테 밥 뭐먹을래?',
    })

    expect(mockTranslationService.translate).toHaveBeenCalledWith({
      koreanInput: '아기한테 밥 뭐먹을래?',
      context: undefined,
    })
    expect(result.translationResult).toEqual(mockTranslationResult)
  })

  it('should save learning record after translation', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      koreanInput: '아기한테 밥 뭐먹을래?',
    })

    expect(mockRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      koreanInput: '아기한테 밥 뭐먹을래?',
      translationResult: mockTranslationResult,
    })
    expect(result.learningRecord).toEqual(mockLearningRecord)
  })

  it('should pass optional context to translation service', async () => {
    await useCase.execute({
      userId: 'user-1',
      koreanInput: '아기한테 밥 뭐먹을래?',
      context: '아이와 대화할 때',
    })

    expect(mockTranslationService.translate).toHaveBeenCalledWith({
      koreanInput: '아기한테 밥 뭐먹을래?',
      context: '아이와 대화할 때',
    })
  })

  it('should throw error if translation fails', async () => {
    mockTranslationService.translate = vi.fn().mockRejectedValue(new Error('API Error'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        koreanInput: '아기한테 밥 뭐먹을래?',
      })
    ).rejects.toThrow('API Error')
  })
})
