'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Link2, Image as ImageIcon, MessageCircle, Check } from 'lucide-react'
import type { TranslationResult } from '@/domain/entities/translation'

interface ShareButtonProps {
  result: TranslationResult
  koreanInput: string
}

// 안전한 텍스트 설정 헬퍼
function setTextContent(element: HTMLElement, text: string): void {
  element.textContent = text
}

// 스타일이 적용된 요소 생성 헬퍼
function createElement(
  tag: string,
  styles: Partial<CSSStyleDeclaration>,
  textContent?: string
): HTMLElement {
  const element = document.createElement(tag)
  Object.assign(element.style, styles)
  if (textContent !== undefined) {
    setTextContent(element, textContent)
  }
  return element
}

export function ShareButton({ result, koreanInput }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // 공유용 텍스트 생성
  const createShareText = (): string => {
    return `🇰🇷 "${koreanInput}"
🇺🇸 "${result.mainExpression.english}"

💡 ${result.explanation.context}

#OhMyEnglish #영어회화 #영어표현`
  }

  // 클립보드에 링크 복사
  const handleCopyLink = async () => {
    const shareText = createShareText()
    const url = typeof window !== 'undefined' ? window.location.href : ''

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (typeof window === 'undefined') return

    const kakao = (window as Window & { Kakao?: KakaoSDK }).Kakao

    if (!kakao?.isInitialized()) {
      // Kakao SDK 초기화 필요 알림
      alert('카카오톡 공유 기능을 사용하려면 카카오 SDK 설정이 필요합니다.')
      return
    }

    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `"${koreanInput}" 영어로?`,
        description: result.mainExpression.english,
        imageUrl: 'https://oh-my-english.vercel.app/og-image.png',
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: '나도 번역하기',
          link: {
            mobileWebUrl: 'https://oh-my-english.vercel.app',
            webUrl: 'https://oh-my-english.vercel.app',
          },
        },
      ],
    })
  }

  // 이미지 카드 DOM 생성 (안전한 방식)
  const createShareCard = (): HTMLDivElement => {
    // 외부 컨테이너
    const container = createElement('div', {
      width: '400px',
      padding: '32px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      borderRadius: '16px',
    }) as HTMLDivElement

    // 내부 카드
    const card = createElement('div', {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    })

    // 카테고리 태그
    const categoryWrapper = createElement('div', {
      textAlign: 'center',
      marginBottom: '16px',
    })
    const categoryTag = createElement(
      'span',
      {
        background: '#f3f4f6',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        color: '#6b7280',
      },
      result.category
    )
    categoryWrapper.appendChild(categoryTag)
    card.appendChild(categoryWrapper)

    // 한국어 섹션
    const koreanSection = createElement('div', { marginBottom: '20px' })
    const koreanLabel = createElement(
      'p',
      { color: '#9ca3af', fontSize: '14px', marginBottom: '8px' },
      '🇰🇷 한국어'
    )
    const koreanText = createElement(
      'p',
      { fontSize: '18px', color: '#374151', fontWeight: '500' },
      `"${koreanInput}"`
    )
    koreanSection.appendChild(koreanLabel)
    koreanSection.appendChild(koreanText)
    card.appendChild(koreanSection)

    // 영어 섹션
    const englishSection = createElement('div', { marginBottom: '20px' })
    const englishLabel = createElement(
      'p',
      { color: '#9ca3af', fontSize: '14px', marginBottom: '8px' },
      '🇺🇸 English'
    )
    const englishText = createElement(
      'p',
      { fontSize: '20px', color: '#7c3aed', fontWeight: '600' },
      `"${result.mainExpression.english}"`
    )
    englishSection.appendChild(englishLabel)
    englishSection.appendChild(englishText)
    card.appendChild(englishSection)

    // 설명 박스
    const explanationBox = createElement('div', {
      background: '#f9fafb',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
    })
    const explanationText = createElement(
      'p',
      { fontSize: '13px', color: '#6b7280', lineHeight: '1.5' },
      `💡 ${result.explanation.context}`
    )
    explanationBox.appendChild(explanationText)
    card.appendChild(explanationBox)

    // 푸터
    const footer = createElement('div', {
      textAlign: 'center',
      paddingTop: '12px',
      borderTop: '1px solid #e5e7eb',
    })
    const footerText = createElement(
      'p',
      { fontSize: '12px', color: '#9ca3af' },
      'oh-my-english.vercel.app'
    )
    footer.appendChild(footerText)
    card.appendChild(footer)

    container.appendChild(card)
    return container
  }

  // 이미지로 저장
  const handleSaveImage = async () => {
    setIsGeneratingImage(true)

    try {
      // html2canvas 동적 로드
      const html2canvas = (await import('html2canvas')).default

      // 안전한 DOM 방식으로 share card 생성
      const shareCard = createShareCard()
      document.body.appendChild(shareCard)

      const canvas = await html2canvas(shareCard, {
        scale: 2,
        backgroundColor: null,
      })

      document.body.removeChild(shareCard)

      // 이미지 다운로드
      const link = document.createElement('a')
      link.download = `oh-my-english-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to generate image:', error)
      alert('이미지 생성에 실패했습니다.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Web Share API 사용 (모바일 지원)
  const handleNativeShare = async () => {
    if (!navigator.share) {
      // Web Share API 미지원 시 클립보드 복사로 fallback
      handleCopyLink()
      return
    }

    try {
      await navigator.share({
        title: `"${koreanInput}" 영어로?`,
        text: createShareText(),
        url: window.location.href,
      })
    } catch (error) {
      // 사용자가 공유를 취소한 경우 무시
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="공유하기">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          {copied ? '복사됨!' : '링크 복사'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleKakaoShare}>
          <MessageCircle className="mr-2 h-4 w-4" />
          카카오톡 공유
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSaveImage} disabled={isGeneratingImage}>
          <ImageIcon className="mr-2 h-4 w-4" />
          {isGeneratingImage ? '생성 중...' : '이미지로 저장'}
        </DropdownMenuItem>
        {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            다른 앱으로 공유
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Kakao SDK 타입 정의
interface KakaoSDK {
  isInitialized: () => boolean
  Share: {
    sendDefault: (options: {
      objectType: string
      content: {
        title: string
        description: string
        imageUrl: string
        link: {
          mobileWebUrl: string
          webUrl: string
        }
      }
      buttons?: Array<{
        title: string
        link: {
          mobileWebUrl: string
          webUrl: string
        }
      }>
    }) => void
  }
}
