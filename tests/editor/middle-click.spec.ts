import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Middle-click to delete color', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  test('middle-clicking a color item deletes it', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()

    const inner = page.getByTestId('color-item-0').getByTestId('color-card')
    const box = await inner.boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'middle' })

    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
  })

  test('middle-clicking the first of two colors removes only that one', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-1').waitFor()

    const inner = page.getByTestId('color-item-0').getByTestId('color-card')
    const box = await inner.boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: 'middle' })

    await expect(page.getByTestId('color-item-0')).toBeVisible()
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(1)
  })
})
