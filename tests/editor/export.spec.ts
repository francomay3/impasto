import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Export PDF', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('clicking Export PDF triggers a file download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Export PDF' }).click()
    await page.getByRole('button', { name: 'Export' }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })

  test('export modal closes and shows success notification after export', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Export PDF' }).click()

    const modal = page.getByRole('dialog', { name: 'Export PDF' })
    await expect(modal).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    await downloadPromise

    await expect(modal).not.toBeVisible()
    await expect(page.getByText('Export complete')).toBeVisible()
  })
})
