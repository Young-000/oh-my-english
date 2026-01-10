/**
 * SM-2 간소화 버전의 간격 반복 알고리즘
 * 숙달도(mastery level)에 따른 복습 간격(일)
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] as const

/**
 * 숙달도에 따른 다음 복습 날짜 계산
 * @param masteryLevel - 현재 숙달도 (0-5)
 * @returns 다음 복습 예정일
 */
export function calculateNextReview(masteryLevel: number): Date {
  const clampedLevel = Math.max(0, Math.min(masteryLevel, REVIEW_INTERVALS.length - 1))
  const daysUntilNext = REVIEW_INTERVALS[clampedLevel]

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + daysUntilNext)

  return nextDate
}

/**
 * 정답 여부에 따른 새 숙달도 계산
 * @param currentLevel - 현재 숙달도
 * @param isCorrect - 정답 여부
 * @returns 새 숙달도
 */
export function calculateNewMasteryLevel(currentLevel: number, isCorrect: boolean): number {
  if (isCorrect) {
    return Math.min(currentLevel + 1, 5)
  }
  return Math.max(currentLevel - 1, 0)
}
