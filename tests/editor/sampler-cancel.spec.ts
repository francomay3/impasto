import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function openSamplerOverlay(page: import('@playwright/test').Page) {
  await page.getByRole('tab', { name: /Palette/ }).click()
  await page.keyboard.press('e')
  await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
}

test.describe('Sampler overlay cancellation', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('right-clicking the sampler overlay cancels sampling', async ({ page }) => {
    await openSamplerOverlay(page)
    await page.getByTestId('sampler-overlay').click({ button: 'right' })
    await expect(page.getByTestId('sampler-overlay')).not.toBeAttached()
  })

  test('pressing Escape while sampler overlay is open cancels sampling', async ({ page }) => {
    await openSamplerOverlay(page)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('sampler-overlay')).not.toBeAttached()
  })

  test('cancelling via right-click leaves the palette unchanged', async ({ page }) => {
    await openSamplerOverlay(page)
    await page.getByTestId('sampler-overlay').click({ button: 'right' })
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(0)
  })

  test('cancelling via Escape leaves the palette unchanged', async ({ page }) => {
    await openSamplerOverlay(page)
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(0)
  })

  test('cancelling sampler restores the select tool as active', async ({ page }) => {
    await openSamplerOverlay(page)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('tool-select')).toHaveAttribute('data-active', 'true')
  })
})
