import type { QuizAttempt, LearningRecord } from '../entities/translation'
import type { IQuizAttemptRepository } from '../repositories/quiz-repository'
import type { ILearningRecordRepository } from '../repositories/learning-record-repository'
import { QuizGrader, QuizSubmission, QuizResult } from '../services/quiz-generator'
import { calculateNextReview, calculateNewMasteryLevel } from '@/lib/spaced-repetition'

export interface SubmitQuizAnswerInput {
  userId: string
  recordId: string
  quizType: QuizAttempt['quizType']
  question: string
  userAnswer: string
  correctAnswer: string
  timeTakenMs: number
}

export interface SubmitQuizAnswerOutput {
  quizAttempt: QuizAttempt
  quizResult: QuizResult
  updatedRecord: LearningRecord
}

export class SubmitQuizAnswerUseCase {
  private readonly grader: QuizGrader

  constructor(
    private readonly quizAttemptRepository: IQuizAttemptRepository,
    private readonly learningRecordRepository: ILearningRecordRepository
  ) {
    this.grader = new QuizGrader()
  }

  async execute(input: SubmitQuizAnswerInput): Promise<SubmitQuizAnswerOutput> {
    const { userId, recordId, quizType, question, userAnswer, correctAnswer, timeTakenMs } = input

    // 1. 답변 채점
    const submission: QuizSubmission = {
      quizType,
      question,
      userAnswer,
      correctAnswer,
      recordId,
      timeTakenMs,
    }
    const quizResult = this.grader.grade(submission)

    // 2. QuizAttempt 저장
    const quizAttempt = await this.quizAttemptRepository.create({
      userId,
      recordId,
      quizType,
      question,
      userAnswer,
      correctAnswer,
      isCorrect: quizResult.isCorrect,
      timeTakenMs,
    })

    // 3. LearningRecord 숙달도 업데이트
    const currentRecord = await this.learningRecordRepository.findById(recordId)
    if (!currentRecord) {
      throw new Error(`Learning record not found: ${recordId}`)
    }

    const newMasteryLevel = calculateNewMasteryLevel(currentRecord.masteryLevel, quizResult.isCorrect)
    const nextReviewAt = calculateNextReview(newMasteryLevel)

    const updatedRecord = await this.learningRecordRepository.update(recordId, {
      masteryLevel: newMasteryLevel,
      reviewCount: currentRecord.reviewCount + 1,
      nextReviewAt,
    })

    return {
      quizAttempt,
      quizResult,
      updatedRecord,
    }
  }
}
