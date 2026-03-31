import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Header Edit menu', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('Edit > Add Filter submenu shows filter type options', async ({ page }) => {
    await page.getByText('Edit').click()
    await page.getByRole('menuitem', { name: 'Add Filter' }).hover()
    await expect(page.getByRole('menuitem', { name: 'Brightness / Contrast' })).toBeVisible()
  })

  test('Edit > Add Filter > Brightness / Contrast adds a filter item', async ({ page }) => {
    await page.getByText('Edit').click()
    await page.getByRole('menuitem', { name: 'Add Filter' }).hover()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await expect(page.getByTestId('filter-item')).toBeVisible()
    await expect(page.getByTestId('filter-item')).toContainText('Brightness / Contrast')
  })

  test('Edit > Add Filter > Blur adds a blur filter item', async ({ page }) => {
    await page.getByText('Edit').click()
    await page.getByRole('menuitem', { name: 'Add Filter' }).hover()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await expect(page.getByTestId('filter-item')).toContainText('Blur')
  })

  test('Edit > Add Color to Palette adds a color to the palette', async ({ page }) => {
    await page.getByText('Edit').click()
    await page.getByRole('menuitem', { name: 'Add Color to Palette' }).click()
    // Switch to Palette tab to see the added color
    await page.getByRole('tab', { name: /Palette/ }).click()
    await expect(page.getByTestId('color-item-0')).toBeVisible()
  })

  test('Edit menu shows Undo and Redo items', async ({ page }) => {
    await page.getByText('Edit').click()
    await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Redo' })).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('Help > Keyboard Shortcuts opens the shortcuts modal', async ({ page }) => {
    await page.getByText('Help').click()
    await page.getByRole('menuitem', { name: 'Keyboard Shortcuts' }).click()
    await expect(page.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeVisible()
  })

  test('File menu closes when clicking the canvas viewport on the Palette tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('canvas-viewport-filtered').waitFor()

    await page.getByText('File').click()
    await expect(page.getByRole('menu')).toBeVisible()

    const viewport = page.getByTestId('canvas-viewport-filtered')
    const box = await viewport.boundingBox()
    if (!box) throw new Error('canvas-viewport-filtered not found')
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page.getByRole('menu')).not.toBeVisible()
  })
})
