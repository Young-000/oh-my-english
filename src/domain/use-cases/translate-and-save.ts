import type { ITranslationService, TranslationRequest } from '../repositories/translation-service'
import type { ILearningRecordRepository } from '../repositories/learning-record-repository'
import type { TranslationResult, LearningRecord } from '../entities/translation'

export interface TranslateAndSaveInput {
  userId: string
  koreanInput: string
  context?: string
}

export interface TranslateAndSaveOutput {
  translationResult: TranslationResult
  learningRecord: LearningRecord
}

export class TranslateAndSaveUseCase {
  constructor(
    private readonly translationService: ITranslationService,
    private readonly learningRecordRepository: ILearningRecordRepository
  ) {}

  async execute(input: TranslateAndSaveInput): Promise<TranslateAndSaveOutput> {
    const translationRequest: TranslationRequest = {
      koreanInput: input.koreanInput,
      context: input.context,
    }

    const translationResult = await this.translationService.translate(translationRequest)

    const learningRecord = await this.learningRecordRepository.create({
      userId: input.userId,
      koreanInput: input.koreanInput,
      translationResult,
    })

    return {
      translationResult,
      learningRecord,
    }
  }
}
