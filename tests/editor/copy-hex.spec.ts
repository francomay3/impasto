import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Copy hex', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
  })

  test('clicking Copy hex in the context menu shows a notification', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Copy hex' }).click()
    await expect(page.getByText(/Copied #/)).toBeVisible()
  })

  test('Copy hex notification contains the color hex code', async ({ page }) => {
    // Get the hex displayed on the color item first
    const hexText = await page.getByTestId('color-item-0').getByTestId('color-name').textContent()
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Copy hex' }).click()
    // Notification should mention the same hex
    await expect(page.getByText(new RegExp(`Copied ${hexText}`, 'i'))).toBeVisible()
  })
})
