import type { TranslationResult } from '../entities/translation'

export interface TranslationRequest {
  koreanInput: string
  context?: string
}

export interface ITranslationService {
  translate(request: TranslationRequest): Promise<TranslationResult>
}
