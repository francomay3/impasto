import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Palette sampler — color selection', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  test('newly sampled color is immediately selected in the sidebar', async ({ page }) => {
    // Press E to activate the eyedropper / add-color sampling mode
    await page.keyboard.press('e')

    // Wait for the sampler overlay canvas to appear on top of the viewport
    await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })

    // Confirm no color items exist yet
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(0)

    // Click the centre of the sampler canvas to sample a color
    const sampler = page.getByTestId('sampler-overlay')
    const box = await sampler.boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)

    // A new color item should have been added and should be selected immediately
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(1)
    await expect(page.getByTestId('color-item-0')).toHaveAttribute('data-selected', 'true')
  })
})
