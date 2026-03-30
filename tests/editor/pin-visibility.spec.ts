import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

/** Sample a color from the canvas so the color has a pin (color.sample is set). */
async function sampleAColor(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('tab', { name: /Palette/ }).click()
  await page.keyboard.press('e')
  await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
  const sampler = page.getByTestId('sampler-overlay')
  const box = await sampler.boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.locator('[data-testid^="color-item-"]').waitFor()
}

test.describe('Pin visibility toggle', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  test('pin visibility toggle is not visible for a manually added color', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await expect(page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')).not.toBeAttached()
  })

  test('pin visibility toggle is visible for a sampled color', async ({ page }) => {
    await sampleAColor(page)
    await expect(page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')).toBeVisible()
  })

  test('pin is visible by default (no data-hidden attribute)', async ({ page }) => {
    await sampleAColor(page)
    await expect(page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')).not.toHaveAttribute('data-hidden')
  })

  test('clicking the toggle hides the pin (data-hidden becomes true)', async ({ page }) => {
    await sampleAColor(page)
    await page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle').click()
    await expect(page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')).toHaveAttribute('data-hidden', 'true')
  })

  test('clicking the toggle again un-hides the pin', async ({ page }) => {
    await sampleAColor(page)
    const toggle = page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')
    await toggle.click()
    await toggle.click()
    await expect(toggle).not.toHaveAttribute('data-hidden')
  })
})
