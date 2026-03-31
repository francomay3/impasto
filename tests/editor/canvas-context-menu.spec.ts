import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Canvas right-click context menu', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  // --- Filters tab canvases ---

  test('right-clicking either canvas on Filters tab shows Fit to view', async ({ page }) => {
    const canvas = page.getByTestId('canvas-viewport-filtered').first()
    await canvas.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Fit to view' })).toBeVisible()
  })

  test('right-clicking the indexed canvas does not show Add color here', async ({ page }) => {
    const indexed = page.getByTestId('canvas-viewport-indexed').first()
    await indexed.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Add color here' })).not.toBeAttached()
  })

  // --- Palette tab filtered canvas ---

  test('right-clicking the filtered canvas on Palette tab shows Add color here', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    const canvas = page.getByRole('tabpanel', { name: /Palette/ }).getByTestId('canvas-viewport-filtered')
    await canvas.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Add color here' })).toBeVisible()
  })

  test('clicking Add color here adds a color to the palette', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    const canvas = page.getByRole('tabpanel', { name: /Palette/ }).getByTestId('canvas-viewport-filtered')
    await canvas.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Add color here' }).click()
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(1)
  })

  test('right-clicking the filtered canvas on Palette tab shows Show labels', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    const canvas = page.getByRole('tabpanel', { name: /Palette/ }).getByTestId('canvas-viewport-filtered')
    await canvas.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Hide labels' })).toBeVisible()
  })

  test('clicking Hide labels changes the menu item to Show labels', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    const canvas = page.getByRole('tabpanel', { name: /Palette/ }).getByTestId('canvas-viewport-filtered')
    await canvas.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Hide labels' }).click()
    // Re-open context menu to check toggle
    await canvas.click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Show labels' })).toBeVisible()
  })
})
