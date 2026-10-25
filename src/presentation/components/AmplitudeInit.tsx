'use client'

import { useEffect } from 'react'
import { initAmplitude } from '@/infrastructure/analytics/amplitude'

/** 루트 레이아웃에서 한 번 마운트되어 Amplitude를 초기화한다. 키가 없으면 아무 일도 하지 않는다. */
export function AmplitudeInit(): null {
  useEffect(() => {
    initAmplitude()
  }, [])

  return null
}
