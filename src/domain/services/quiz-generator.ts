import type { LearningRecord } from '../entities/translation'

export type QuizType = 'korean_to_english' | 'fill_blank' | 'multiple_choice' | 'matching' | 'listening' | 'sentence_ordering'

export interface MatchingPair {
  id: string
  korean: string
  english: string
}

export interface Quiz {
  type: QuizType
  question: string
  correctAnswer: string
  options?: string[] // multiple_choice 또는 listening인 경우
  hint?: string
  recordId: string
  matchingPairs?: MatchingPair[] // matching인 경우
  audioText?: string // listening인 경우 - TTS로 읽을 영어 텍스트
  scrambledWords?: string[] // sentence_ordering인 경우 - 섞인 단어 배열
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
   * 문장 순서 배열 퀴즈 생성
   * 영어 표현의 단어들을 섞어서 올바른 순서로 재배열하게 함
   */
  generateSentenceOrdering(record: LearningRecord): Quiz {
    const words = record.englishExpression.split(' ')

    // 2단어 이하면 korean_to_english로 대체 (섞을 의미가 없음)
    if (words.length < 3) {
      return this.generateKoreanToEnglish(record)
    }

    // 단어 배열을 섞음
    const scrambledWords = this.shuffleArray([...words])

    // 섞인 결과가 원본과 같으면 다시 섞음 (최대 3번 시도)
    let attempts = 0
    while (scrambledWords.join(' ') === words.join(' ') && attempts < 3) {
      this.shuffleArrayInPlace(scrambledWords)
      attempts++
    }

    return {
      type: 'sentence_ordering',
      question: record.koreanInput,
      correctAnswer: record.englishExpression,
      scrambledWords,
      hint: `${words.length}개의 단어로 이루어진 문장`,
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
   * 듣기 퀴즈 생성
   * 영어 발음을 듣고 올바른 한국어 번역을 선택
   */
  generateListeningQuiz(record: LearningRecord, allRecords: LearningRecord[]): Quiz {
    const correctAnswer = record.koreanInput
    const wrongKoreanAnswers = this.generateWrongKoreanAnswers(record, allRecords)

    // 정답과 오답을 섞음
    const options = this.shuffleArray([correctAnswer, ...wrongKoreanAnswers])

    return {
      type: 'listening',
      question: '들리는 영어 표현의 올바른 한국어 번역을 선택하세요',
      correctAnswer,
      options,
      recordId: record.id,
      audioText: record.englishExpression, // TTS로 읽을 영어 텍스트
    }
  }

  /**
   * 매칭 퀴즈 생성
   * 4개의 한국어-영어 쌍을 매칭하는 퀴즈
   */
  generateMatchingQuiz(records: LearningRecord[]): Quiz {
    // 최소 4개의 레코드 필요
    const selectedRecords = records.slice(0, 4)

    if (selectedRecords.length < 4) {
      // 4개 미만이면 단일 레코드로 korean_to_english 퀴즈 생성
      return this.generateKoreanToEnglish(selectedRecords[0])
    }

    const pairs: MatchingPair[] = selectedRecords.map((record, index) => ({
      id: `pair-${index}`,
      korean: record.koreanInput,
      english: record.englishExpression,
    }))

    // 정답 형식: "pair-0:english0,pair-1:english1,pair-2:english2,pair-3:english3"
    const correctAnswer = pairs.map((pair) => `${pair.id}:${pair.english}`).join(',')

    return {
      type: 'matching',
      question: '한국어와 영어 표현을 매칭하세요',
      correctAnswer,
      recordId: selectedRecords[0].id, // 첫 번째 레코드 ID를 대표로 사용
      matchingPairs: pairs,
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
      case 'sentence_ordering':
        return this.generateSentenceOrdering(record)
      case 'listening':
        return this.generateListeningQuiz(record, allRecords)
      case 'matching':
        // matching은 여러 레코드가 필요하므로 별도 호출 필요, 기본값으로 korean_to_english 반환
        return this.generateKoreanToEnglish(record)
    }
  }

  /**
   * 숙달도에 따른 퀴즈 타입 선택
   * 낮은 숙달도 → 쉬운 객관식/듣기
   * 높은 숙달도 → 어려운 직접 입력
   */
  private selectQuizTypeByMastery(masteryLevel: number): QuizType {
    if (masteryLevel <= 1) {
      // 낮은 숙달도: multiple_choice(60%) 또는 listening(40%)
      return Math.random() < 0.6 ? 'multiple_choice' : 'listening'
    }
    if (masteryLevel <= 3) {
      // 중간 숙달도: fill_blank(50%), listening(30%), sentence_ordering(20%)
      const rand = Math.random()
      if (rand < 0.5) return 'fill_blank'
      if (rand < 0.8) return 'listening'
      return 'sentence_ordering'
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

  /**
   * 한국어 오답 생성 (듣기 퀴즈용)
   */
  private generateWrongKoreanAnswers(
    record: LearningRecord,
    allRecords: LearningRecord[]
  ): string[] {
    const wrongAnswers: string[] = []
    const usedAnswers = new Set([record.koreanInput.toLowerCase()])

    // 1. 같은 카테고리의 다른 기록에서 한국어 오답 추출
    const sameCategory = allRecords.filter(
      (r) => r.id !== record.id && r.category === record.category
    )
    for (const other of sameCategory) {
      if (wrongAnswers.length >= 3) break
      if (!usedAnswers.has(other.koreanInput.toLowerCase())) {
        wrongAnswers.push(other.koreanInput)
        usedAnswers.add(other.koreanInput.toLowerCase())
      }
    }

    // 2. 다른 카테고리의 기록에서 한국어 오답 추출
    for (const other of allRecords) {
      if (wrongAnswers.length >= 3) break
      if (other.id !== record.id && !usedAnswers.has(other.koreanInput.toLowerCase())) {
        wrongAnswers.push(other.koreanInput)
        usedAnswers.add(other.koreanInput.toLowerCase())
      }
    }

    // 3. 최소 3개를 보장하기 위한 더미 한국어 오답
    const dummyKoreanAnswers = [
      '알겠습니다.',
      '감사합니다.',
      '실례합니다.',
      '모르겠어요.',
      '생각해볼게요.',
    ]
    for (const dummy of dummyKoreanAnswers) {
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

  private shuffleArrayInPlace<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
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
      case 'sentence_ordering':
        return this.gradeSentenceOrdering(userAnswer, correctAnswer)
      case 'matching':
        return this.gradeMatching(userAnswer, correctAnswer)
      case 'listening':
        // listening은 객관식과 동일한 방식으로 채점 (정확히 일치해야 정답)
        return this.gradeListening(userAnswer, correctAnswer)
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

  private gradeListening(userAnswer: string, correctAnswer: string): QuizResult {
    const isCorrect =
      this.normalizeAnswer(userAnswer) === this.normalizeAnswer(correctAnswer)

    return {
      isCorrect,
      correctAnswer,
      userAnswer,
      similarity: isCorrect ? 1 : 0,
      feedback: isCorrect
        ? '정답입니다! 잘 들으셨어요! 🎉'
        : `틀렸습니다. 정답은 "${correctAnswer}"입니다.`,
    }
  }

  /**
   * 문장 순서 배열 퀴즈 채점
   */
  private gradeSentenceOrdering(userAnswer: string, correctAnswer: string): QuizResult {
    const normalizedUser = this.normalizeAnswer(userAnswer)
    const normalizedCorrect = this.normalizeAnswer(correctAnswer)

    if (normalizedUser === normalizedCorrect) {
      return {
        isCorrect: true,
        correctAnswer,
        userAnswer,
        similarity: 1,
        feedback: '완벽합니다! 문장 순서를 정확히 맞췄어요! 🎉',
      }
    }

    // 단어 순서 유사도 계산
    const userWords = normalizedUser.split(' ')
    const correctWords = normalizedCorrect.split(' ')

    let matchCount = 0
    const minLen = Math.min(userWords.length, correctWords.length)

    for (let i = 0; i < minLen; i++) {
      if (userWords[i] === correctWords[i]) {
        matchCount++
      }
    }

    const similarity = correctWords.length > 0 ? matchCount / correctWords.length : 0

    if (similarity >= 0.8) {
      return {
        isCorrect: false,
        correctAnswer,
        userAnswer,
        similarity,
        feedback: '거의 맞았어요! 몇 단어의 순서만 다릅니다.',
      }
    }

    return {
      isCorrect: false,
      correctAnswer,
      userAnswer,
      similarity,
      feedback: `정답은 "${correctAnswer}"입니다. 다시 시도해보세요!`,
    }
  }

  /**
   * 매칭 퀴즈 채점
   * 답변 형식: "pair-0:english0,pair-1:english1,pair-2:english2,pair-3:english3"
   * 각 쌍의 정답 여부를 비교하여 부분 점수 산정
   */
  private gradeMatching(userAnswer: string, correctAnswer: string): QuizResult {
    // 정답과 사용자 답변 파싱
    const correctPairs = this.parseMatchingAnswer(correctAnswer)
    const userPairs = this.parseMatchingAnswer(userAnswer)

    // 매칭된 쌍 수 계산
    let correctCount = 0
    const totalPairs = correctPairs.size

    for (const [pairId, correctEnglish] of correctPairs) {
      const userEnglish = userPairs.get(pairId)
      if (
        userEnglish &&
        this.normalizeAnswer(userEnglish) === this.normalizeAnswer(correctEnglish)
      ) {
        correctCount++
      }
    }

    const similarity = totalPairs > 0 ? correctCount / totalPairs : 0
    const isCorrect = correctCount === totalPairs

    let feedback: string
    if (isCorrect) {
      feedback = '완벽합니다! 모든 쌍을 정확히 매칭했어요! 🎉'
    } else if (similarity >= 0.75) {
      feedback = `잘했어요! ${correctCount}/${totalPairs}개를 맞췄습니다.`
    } else if (similarity >= 0.5) {
      feedback = `${correctCount}/${totalPairs}개 정답. 조금 더 연습해보세요!`
    } else {
      feedback = `${correctCount}/${totalPairs}개 정답. 다시 복습해보세요!`
    }

    return {
      isCorrect,
      correctAnswer,
      userAnswer,
      similarity,
      feedback,
    }
  }

  /**
   * 매칭 답변 파싱
   * "pair-0:english0,pair-1:english1" -> Map<pairId, english>
   */
  private parseMatchingAnswer(answer: string): Map<string, string> {
    const result = new Map<string, string>()
    const pairs = answer.split(',')

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':')
      if (colonIndex > 0) {
        const pairId = pair.substring(0, colonIndex).trim()
        const english = pair.substring(colonIndex + 1).trim()
        result.set(pairId, english)
      }
    }

    return result
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
