import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Keyboard shortcuts modal', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('pressing ? opens the shortcuts modal', async ({ page }) => {
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeVisible()
  })

  test('modal lists key shortcut actions', async ({ page }) => {
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog')).toContainText('Undo')
    await expect(page.getByRole('dialog')).toContainText('Redo')
    await expect(page.getByRole('dialog')).toContainText('Add Filter')
  })

  test('pressing Escape closes the shortcuts modal', async ({ page }) => {
    await page.keyboard.press('?')
    await page.getByRole('dialog', { name: 'Keyboard Shortcuts' }).waitFor()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Keyboard Shortcuts' })).not.toBeVisible()
  })
})
