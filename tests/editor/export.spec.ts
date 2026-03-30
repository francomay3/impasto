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

  test('Cancel button closes the modal without triggering a download', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Export PDF' }).click()
    await page.getByRole('dialog', { name: 'Export PDF' }).waitFor()

    // Attach a download listener to fail if one fires
    let downloadFired = false
    page.once('download', () => { downloadFired = true })

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog', { name: 'Export PDF' })).not.toBeVisible()
    expect(downloadFired).toBe(false)
  })

  test('export modal shows the PDF title field pre-filled with the project name', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Export PDF' }).click()
    await page.getByRole('dialog', { name: 'Export PDF' }).waitFor()
    const titleInput = page.getByLabel('PDF title')
    await expect(titleInput).toHaveValue('Untitled Project')
  })

  test('export modal shows pigment checkboxes', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Export PDF' }).click()
    await page.getByRole('dialog', { name: 'Export PDF' }).waitFor()
    // At least one pigment checkbox should be visible and checked
    const checkboxes = page.getByRole('dialog', { name: 'Export PDF' }).getByRole('checkbox')
    await expect(checkboxes.first()).toBeChecked()
    expect(await checkboxes.count()).toBeGreaterThan(0)
  })
})
