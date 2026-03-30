import { test, expect } from '@playwright/test'
import { openEditorWithImage, activateTool } from '../helpers'

test.describe('Contextual toolbar number inputs', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  // --- Pre-index blur (always visible on Palette tab) ---

  test('pre-index blur input shows the default value of 3', async ({ page }) => {
    const input = page.getByTestId('contextual-toolbar').locator('[data-testid="pre-index-blur-input"] input')
    await expect(input).toHaveValue('3')
  })

  test('changing the pre-index blur value updates the input', async ({ page }) => {
    const input = page.getByTestId('contextual-toolbar').locator('[data-testid="pre-index-blur-input"] input')
    await input.fill('10')
    await input.press('Tab')
    await expect(input).toHaveValue('10')
  })

  test('pre-index blur value is clamped to its maximum of 50', async ({ page }) => {
    const input = page.getByTestId('contextual-toolbar').locator('[data-testid="pre-index-blur-input"] input')
    await input.fill('99')
    await input.press('Tab')
    await expect(input).toHaveValue('50')
  })

  // --- Sampling radius (visible on Palette tab when eyedropper is active) ---

  test('sampling radius input shows the default value of 30', async ({ page }) => {
    await activateTool(page, 'eyedropper')
    const input = page.getByTestId('contextual-toolbar').locator('[data-testid="sampling-radius-input"] input')
    await expect(input).toHaveValue('30')
  })

  test('changing the sampling radius updates the input', async ({ page }) => {
    await activateTool(page, 'eyedropper')
    const input = page.getByTestId('contextual-toolbar').locator('[data-testid="sampling-radius-input"] input')
    await input.fill('50')
    await input.press('Tab')
    await expect(input).toHaveValue('50')
  })

  test('sampling radius input is not visible when select tool is active', async ({ page }) => {
    // select tool is the default
    await expect(page.locator('[data-testid="sampling-radius-input"]')).not.toBeAttached()
  })
})
