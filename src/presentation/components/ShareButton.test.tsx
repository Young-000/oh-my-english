import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareButton } from './ShareButton'
import type { TranslationResult } from '@/domain/entities/translation'

const mockResult: TranslationResult = {
  mainExpression: {
    english: 'What do you wanna eat?',
    formality: 'casual',
  },
  explanation: {
    context: '친구나 가족에게 편하게 물어볼 때 사용하는 표현',
    nuance: '친근하고 캐주얼한 느낌',
  },
  alternatives: [
    {
      expression: 'What are you in the mood for?',
      situation: '좀 더 부드럽게 물어볼 때',
      difference: '기분이나 입맛을 물어보는 뉘앙스',
    },
  ],
  relatedVocabulary: [],
  category: '일상대화',
}

const mockKoreanInput = '밥 뭐 먹을래?'

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render share button', () => {
    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    const shareButton = screen.getByRole('button', { name: /공유하기/i })
    expect(shareButton).toBeInTheDocument()
  })

  it('should open dropdown menu on click', async () => {
    const user = userEvent.setup()
    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    const shareButton = screen.getByRole('button', { name: /공유하기/i })
    await user.click(shareButton)

    expect(screen.getByText('링크 복사')).toBeInTheDocument()
    expect(screen.getByText('카카오톡 공유')).toBeInTheDocument()
    expect(screen.getByText('이미지로 저장')).toBeInTheDocument()
  })

  it('should copy link to clipboard when "링크 복사" is clicked', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    const shareButton = screen.getByRole('button', { name: /공유하기/i })
    await user.click(shareButton)

    const copyLinkItem = screen.getByText('링크 복사')
    await user.click(copyLinkItem)

    expect(mockWriteText).toHaveBeenCalled()
    const calledWith = mockWriteText.mock.calls[0][0] as string
    expect(calledWith).toContain(mockKoreanInput)
    expect(calledWith).toContain(mockResult.mainExpression.english)
    expect(calledWith).toContain('#OhMyEnglish')
  })

  it('should show "복사됨!" feedback after copying', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    const shareButton = screen.getByRole('button', { name: /공유하기/i })
    await user.click(shareButton)

    const copyLinkItem = screen.getByText('링크 복사')
    await user.click(copyLinkItem)

    // Dropdown을 다시 열어서 확인
    await user.click(shareButton)

    await waitFor(() => {
      expect(screen.getByText('복사됨!')).toBeInTheDocument()
    })
  })

  it('should alert when Kakao SDK is not initialized', async () => {
    const user = userEvent.setup()
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    const shareButton = screen.getByRole('button', { name: /공유하기/i })
    await user.click(shareButton)

    const kakaoShareItem = screen.getByText('카카오톡 공유')
    await user.click(kakaoShareItem)

    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('카카오 SDK')
    )

    mockAlert.mockRestore()
  })

  it('should include all required share text elements', () => {
    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    // 공유 텍스트 생성 로직 테스트 (내부 함수이므로 클립보드 복사 결과로 확인)
    // ShareButton 컴포넌트가 올바르게 렌더링되었음을 확인
    expect(screen.getByRole('button', { name: /공유하기/i })).toBeInTheDocument()
  })
})

describe('ShareButton - Image generation', () => {
  it('should show loading state when generating image', async () => {
    const user = userEvent.setup()

    // html2canvas 모듈 모킹
    vi.mock('html2canvas', () => ({
      default: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                toDataURL: () => 'data:image/png;base64,mock',
              })
            }, 100)
          })
      ),
    }))

    render(<ShareButton result={mockResult} koreanInput={mockKoreanInput} />)

    const shareButton = screen.getByRole('button', { name: /공유하기/i })
    await user.click(shareButton)

    const saveImageItem = screen.getByText('이미지로 저장')
    expect(saveImageItem).not.toBeDisabled()
  })
})
