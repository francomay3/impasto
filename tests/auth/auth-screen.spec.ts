import { test, expect } from '@playwright/test'

test.describe('Auth screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the auth screen when not signed in', async ({ page }) => {
    await expect(page.getByTestId('auth-screen')).toBeVisible()
  })

  test('displays the app name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to Impasto' })).toBeVisible()
  })

  test('shows the sign in with Google button', async ({ page }) => {
    await expect(page.getByTestId('sign-in-google')).toBeVisible()
    await expect(page.getByTestId('sign-in-google')).toContainText('Continue with Google')
  })

  test('sign in button is enabled', async ({ page }) => {
    await expect(page.getByTestId('sign-in-google')).toBeEnabled()
  })
})
