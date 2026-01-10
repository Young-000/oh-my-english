import { test, expect } from '@playwright/test'

test.describe('Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the main page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Oh My English')
  })

  test('should have a translation input textarea', async ({ page }) => {
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveAttribute('placeholder', /한국어/)
  })

  test('should have a submit button', async ({ page }) => {
    // Send 아이콘 버튼
    const button = page.locator('button[type="submit"]')
    await expect(button).toBeVisible()
  })

  test('should display feature cards initially', async ({ page }) => {
    await expect(page.getByText('자연스러운 표현')).toBeVisible()
    await expect(page.getByText('관련 어휘')).toBeVisible()
    await expect(page.getByText('학습 기록')).toBeVisible()
    await expect(page.getByText('스마트 복습')).toBeVisible()
  })
})

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page title', async ({ page }) => {
    // CardTitle에 있는 제목
    await expect(page.locator('[data-slot="card-title"]')).toContainText('Oh My English!')
  })

  test('should have email input field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('should have Google login button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /Google/ })
    await expect(googleButton).toBeVisible()
  })

  test('should have back link to main page', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /돌아가기/ })
    await expect(backLink).toBeVisible()
    await backLink.click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Translation Input Flow (UI only)', () => {
  test('should allow typing in the input field', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('밥 뭐 먹을래?')

    await expect(textarea).toHaveValue('밥 뭐 먹을래?')
  })

  test('should enable submit button when input is provided', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    const submitButton = page.locator('button[type="submit"]')

    // 초기에는 비활성화
    await expect(submitButton).toBeDisabled()

    // 입력 후 활성화
    await textarea.fill('안녕하세요')
    await expect(submitButton).toBeEnabled()
  })

  test('should show character count', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('테스트')

    // 3글자 입력 후 카운트 표시
    await expect(page.getByText('3/500')).toBeVisible()
  })

  test('should toggle context input', async ({ page }) => {
    await page.goto('/')

    // 초기에는 컨텍스트 입력이 보이지 않음
    const contextTextarea = page.locator('textarea').nth(1)
    await expect(contextTextarea).not.toBeVisible()

    // 클릭하면 보임
    await page.getByText('추가 컨텍스트').click()
    await expect(contextTextarea).toBeVisible()
  })

  test('should show loading or error state when submitting', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('테스트 입력')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // 로딩 또는 에러 상태 확인
    // API 키가 없으면 빠르게 에러로 전환됨
    const anyStateChange = page.locator('.animate-spin, .animate-pulse, [class*="destructive"]')
    await expect(anyStateChange.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Responsive Design', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should be usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('should have accessible form inputs', async ({ page }) => {
    await page.goto('/')

    // textarea에 placeholder가 있어야 함
    const textarea = page.locator('textarea').first()
    await expect(textarea).toHaveAttribute('placeholder', /.+/)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')

    // Tab으로 주요 요소 접근 가능 확인
    await page.keyboard.press('Tab')

    // 포커스가 이동했는지 확인
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should support Enter key submission', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.focus()
    await textarea.fill('테스트')

    // Enter로 제출
    await page.keyboard.press('Enter')

    // 로딩 또는 에러 상태 확인
    const loadingOrError = page.locator('.animate-pulse, [class*="destructive"]')
    await expect(loadingOrError.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Error Handling', () => {
  test('should display error message on API failure', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('에러 테스트')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // API 키가 없으므로 에러 메시지가 표시되어야 함
    const errorMessage = page.locator('[class*="destructive"]')
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 })
  })
})
