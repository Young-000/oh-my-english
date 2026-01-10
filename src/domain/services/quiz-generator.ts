import type { LearningRecord, QuizAttempt } from '../entities/translation'

export type QuizType = 'korean_to_english' | 'fill_blank' | 'multiple_choice'

export interface Quiz {
  type: QuizType
  question: string
  correctAnswer: string
  options?: string[] // multiple_choice인 경우
  hint?: string
  recordId: string
}

export interface QuizSubmission {
  quizType: QuizType
  question: string
  userAnswer: string
  correctAnswer: string
  recordId: string
  timeTakenMs: number
}

export interface QuizResult {
  isCorrect: boolean
  correctAnswer: string
  userAnswer: string
  similarity?: number // 부분 정답인 경우 유사도
  feedback: string
}

/**
 * 학습 기록을 기반으로 퀴즈를 생성하는 서비스
 */
export class QuizGenerator {
  /**
   * 한국어 → 영어 번역 퀴즈 생성
   */
  generateKoreanToEnglish(record: LearningRecord): Quiz {
    return {
      type: 'korean_to_english',
      question: record.koreanInput,
      correctAnswer: record.englishExpression,
      hint: this.generateHint(record.englishExpression),
      recordId: record.id,
    }
  }

  /**
   * 빈칸 채우기 퀴즈 생성
   * 영어 표현에서 핵심 단어를 빈칸으로 대체
   */
  generateFillBlank(record: LearningRecord): Quiz {
    const words = record.englishExpression.split(' ')

    if (words.length < 3) {
      // 너무 짧으면 한국어→영어로 대체
      return this.generateKoreanToEnglish(record)
    }

    // 관사, 전치사 등 기능어 제외하고 내용어 선택
    const contentWordIndices = this.findContentWordIndices(words)
    if (contentWordIndices.length === 0) {
      return this.generateKoreanToEnglish(record)
    }

    const blankIndex = contentWordIndices[Math.floor(Math.random() * contentWordIndices.length)]
    const correctWord = words[blankIndex]
    const questionWords = [...words]
    questionWords[blankIndex] = '_____'

    return {
      type: 'fill_blank',
      question: `${record.koreanInput}\n\n"${questionWords.join(' ')}"`,
      correctAnswer: correctWord,
      hint: `${correctWord.length}글자 단어`,
      recordId: record.id,
    }
  }

  /**
   * 객관식 퀴즈 생성
   * 정답 + 관련 어휘/대안 표현에서 오답 생성
   */
  generateMultipleChoice(record: LearningRecord, allRecords: LearningRecord[]): Quiz {
    const correctAnswer = record.englishExpression
    const wrongAnswers = this.generateWrongAnswers(record, allRecords)

    // 정답과 오답을 섞음
    const options = this.shuffleArray([correctAnswer, ...wrongAnswers])

    return {
      type: 'multiple_choice',
      question: record.koreanInput,
      correctAnswer,
      options,
      recordId: record.id,
    }
  }

  /**
   * 복습이 필요한 기록에서 랜덤 퀴즈 생성
   */
  generateRandomQuiz(
    record: LearningRecord,
    allRecords: LearningRecord[] = [],
    preferredType?: QuizType
  ): Quiz {
    if (preferredType) {
      return this.generateByType(record, allRecords, preferredType)
    }

    // 숙달도에 따른 퀴즈 타입 선택
    const quizType = this.selectQuizTypeByMastery(record.masteryLevel)
    return this.generateByType(record, allRecords, quizType)
  }

  private generateByType(
    record: LearningRecord,
    allRecords: LearningRecord[],
    type: QuizType
  ): Quiz {
    switch (type) {
      case 'korean_to_english':
        return this.generateKoreanToEnglish(record)
      case 'fill_blank':
        return this.generateFillBlank(record)
      case 'multiple_choice':
        return this.generateMultipleChoice(record, allRecords)
    }
  }

  /**
   * 숙달도에 따른 퀴즈 타입 선택
   * 낮은 숙달도 → 쉬운 객관식
   * 높은 숙달도 → 어려운 직접 입력
   */
  private selectQuizTypeByMastery(masteryLevel: number): QuizType {
    if (masteryLevel <= 1) {
      return 'multiple_choice'
    }
    if (masteryLevel <= 3) {
      return 'fill_blank'
    }
    return 'korean_to_english'
  }

  private generateHint(answer: string): string {
    const words = answer.split(' ')
    if (words.length === 1) {
      return `${answer[0]}...로 시작`
    }
    return `${words[0]}...으로 시작하는 ${words.length}단어`
  }

  private findContentWordIndices(words: string[]): number[] {
    const functionWords = new Set([
      'a',
      'an',
      'the',
      'is',
      'are',
      'was',
      'were',
      'am',
      'be',
      'been',
      'to',
      'for',
      'of',
      'in',
      'on',
      'at',
      'by',
      'with',
      'and',
      'or',
      'but',
      'if',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'my',
      'your',
      'his',
      'her',
      'its',
      'our',
      'their',
      'do',
      'does',
      'did',
      'have',
      'has',
      'had',
      'will',
      'would',
      'could',
      'should',
      'can',
      'may',
      'might',
      'must',
    ])

    return words
      .map((word, index) => ({ word: word.toLowerCase().replace(/[?.!,]/g, ''), index }))
      .filter((item) => !functionWords.has(item.word) && item.word.length > 2)
      .map((item) => item.index)
  }

  private generateWrongAnswers(record: LearningRecord, allRecords: LearningRecord[]): string[] {
    const wrongAnswers: string[] = []
    const usedAnswers = new Set([record.englishExpression.toLowerCase()])

    // 1. 대안 표현에서 오답 추출 (같은 의미지만 다른 표현)
    for (const alt of record.alternatives) {
      if (wrongAnswers.length >= 3) break
      if (!usedAnswers.has(alt.expression.toLowerCase())) {
        wrongAnswers.push(alt.expression)
        usedAnswers.add(alt.expression.toLowerCase())
      }
    }

    // 2. 같은 카테고리의 다른 기록에서 오답 추출
    const sameCategory = allRecords.filter(
      (r) => r.id !== record.id && r.category === record.category
    )
    for (const other of sameCategory) {
      if (wrongAnswers.length >= 3) break
      if (!usedAnswers.has(other.englishExpression.toLowerCase())) {
        wrongAnswers.push(other.englishExpression)
        usedAnswers.add(other.englishExpression.toLowerCase())
      }
    }

    // 3. 부족하면 다른 기록에서 채움
    for (const other of allRecords) {
      if (wrongAnswers.length >= 3) break
      if (other.id !== record.id && !usedAnswers.has(other.englishExpression.toLowerCase())) {
        wrongAnswers.push(other.englishExpression)
        usedAnswers.add(other.englishExpression.toLowerCase())
      }
    }

    // 4. 최소 3개를 보장하기 위한 더미 오답 (실제 운영에서는 피해야 함)
    const dummyAnswers = [
      'I understand.',
      'Thank you.',
      'Excuse me.',
      "I don't know.",
      'Let me think.',
    ]
    for (const dummy of dummyAnswers) {
      if (wrongAnswers.length >= 3) break
      if (!usedAnswers.has(dummy.toLowerCase())) {
        wrongAnswers.push(dummy)
        usedAnswers.add(dummy.toLowerCase())
      }
    }

    return wrongAnswers.slice(0, 3)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

/**
 * 퀴즈 채점 서비스
 */
export class QuizGrader {
  /**
   * 사용자 답변 채점
   */
  grade(submission: QuizSubmission): QuizResult {
    const { userAnswer, correctAnswer, quizType } = submission

    switch (quizType) {
      case 'korean_to_english':
        return this.gradeKoreanToEnglish(userAnswer, correctAnswer)
      case 'fill_blank':
        return this.gradeFillBlank(userAnswer, correctAnswer)
      case 'multiple_choice':
        return this.gradeMultipleChoice(userAnswer, correctAnswer)
    }
  }

  private gradeKoreanToEnglish(userAnswer: string, correctAnswer: string): QuizResult {
    const normalizedUser = this.normalizeAnswer(userAnswer)
    const normalizedCorrect = this.normalizeAnswer(correctAnswer)

    // 정확히 일치
    if (normalizedUser === normalizedCorrect) {
      return {
        isCorrect: true,
        correctAnswer,
        userAnswer,
        similarity: 1,
        feedback: '정확합니다! 🎉',
      }
    }

    // 유사도 계산 (Levenshtein distance 기반)
    const similarity = this.calculateSimilarity(normalizedUser, normalizedCorrect)

    // 90% 이상이면 정답으로 인정 (오타 허용)
    if (similarity >= 0.9) {
      return {
        isCorrect: true,
        correctAnswer,
        userAnswer,
        similarity,
        feedback: '거의 정확합니다! 작은 오타가 있었어요.',
      }
    }

    // 70% 이상이면 부분 정답
    if (similarity >= 0.7) {
      return {
        isCorrect: false,
        correctAnswer,
        userAnswer,
        similarity,
        feedback: `아깝습니다! 정답은 "${correctAnswer}"입니다.`,
      }
    }

    return {
      isCorrect: false,
      correctAnswer,
      userAnswer,
      similarity,
      feedback: `정답은 "${correctAnswer}"입니다. 다시 복습해보세요!`,
    }
  }

  private gradeFillBlank(userAnswer: string, correctAnswer: string): QuizResult {
    const normalizedUser = this.normalizeAnswer(userAnswer)
    const normalizedCorrect = this.normalizeAnswer(correctAnswer)

    if (normalizedUser === normalizedCorrect) {
      return {
        isCorrect: true,
        correctAnswer,
        userAnswer,
        similarity: 1,
        feedback: '정확합니다! 🎉',
      }
    }

    const similarity = this.calculateSimilarity(normalizedUser, normalizedCorrect)

    if (similarity >= 0.85) {
      return {
        isCorrect: true,
        correctAnswer,
        userAnswer,
        similarity,
        feedback: '정답입니다! 스펠링에 주의하세요.',
      }
    }

    return {
      isCorrect: false,
      correctAnswer,
      userAnswer,
      similarity,
      feedback: `정답은 "${correctAnswer}"입니다.`,
    }
  }

  private gradeMultipleChoice(userAnswer: string, correctAnswer: string): QuizResult {
    const isCorrect =
      this.normalizeAnswer(userAnswer) === this.normalizeAnswer(correctAnswer)

    return {
      isCorrect,
      correctAnswer,
      userAnswer,
      similarity: isCorrect ? 1 : 0,
      feedback: isCorrect
        ? '정답입니다! 🎉'
        : `틀렸습니다. 정답은 "${correctAnswer}"입니다.`,
    }
  }

  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/[?.!,]/g, '')
      .replace(/\s+/g, ' ')
  }

  /**
   * 두 문자열의 유사도 계산 (0-1)
   * 간단한 Levenshtein 기반
   */
  private calculateSimilarity(s1: string, s2: string): number {
    const len1 = s1.length
    const len2 = s2.length

    if (len1 === 0 && len2 === 0) return 1
    if (len1 === 0 || len2 === 0) return 0

    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)

    return 1 - distance / maxLen
  }
}

export const quizGenerator = new QuizGenerator()
export const quizGrader = new QuizGrader()
