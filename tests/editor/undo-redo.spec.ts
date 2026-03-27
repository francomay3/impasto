import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

// Mantine's `mod` key maps to Meta on macOS and Ctrl elsewhere
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

async function addBrightnessFilter(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('button', { name: /Add Filter/ }).click()
  await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
  await page.getByTestId('filter-item').waitFor()
}

test.describe('Undo / Redo', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
  })

  // NOTE: Uploading an image is a history-tracked action (setImage → saveAndSet → historyPush),
  // so Undo is enabled as soon as the editor opens with an image.

  test('Undo is available after opening the editor (image upload is tracked)', async ({ page }) => {
    await page.getByText('Edit').click()
    await expect(page.getByRole('menuitem', { name: 'Undo' })).not.toHaveAttribute('data-disabled', 'true')
    await page.keyboard.press('Escape')
  })

  test('Redo is not available before any undo action', async ({ page }) => {
    await page.getByText('Edit').click()
    // Mantine disabled Menu.Item uses data-disabled, not the HTML disabled attribute
    await expect(page.getByRole('menuitem', { name: 'Redo' })).toHaveAttribute('data-disabled', 'true')
    await page.keyboard.press('Escape')
  })

  test('keyboard undo removes the last added filter', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.keyboard.press(`${mod}+z`)
    await expect(page.getByTestId('filter-item')).not.toBeAttached()
    await expect(page.getByText('No filters added yet')).toBeVisible()
  })

  test('keyboard redo restores the undone filter', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.keyboard.press(`${mod}+z`)
    await page.keyboard.press(`${mod}+Shift+z`)
    await expect(page.getByTestId('filter-item')).toBeVisible()
    await expect(page.getByTestId('filter-item')).toContainText('Brightness / Contrast')
  })

  test('menu Undo removes the last added filter', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByText('Edit').click()
    await page.getByRole('menuitem', { name: 'Undo' }).click()
    await expect(page.getByTestId('filter-item')).not.toBeAttached()
  })

  test('Redo becomes enabled after undoing a filter', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.keyboard.press(`${mod}+z`)
    await page.getByText('Edit').click()
    await expect(page.getByRole('menuitem', { name: 'Redo' })).not.toHaveAttribute('data-disabled', 'true')
    await page.keyboard.press('Escape')
  })

  test('Undo and Redo can cycle through multiple filter additions', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await expect(page.getByTestId('filter-item')).toHaveCount(2)

    await page.keyboard.press(`${mod}+z`)
    await expect(page.getByTestId('filter-item')).toHaveCount(1)

    await page.keyboard.press(`${mod}+z`)
    await expect(page.getByTestId('filter-item')).not.toBeAttached()

    await page.keyboard.press(`${mod}+Shift+z`)
    await expect(page.getByTestId('filter-item')).toHaveCount(1)
  })
})
