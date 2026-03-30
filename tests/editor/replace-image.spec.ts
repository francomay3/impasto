import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

/** Sample a color from the canvas so the palette has a pin (hasSamples = true). */
async function sampleAColor(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('tab', { name: /Palette/ }).click()
  await page.keyboard.press('e')
  await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
  const sampler = page.getByTestId('sampler-overlay')
  const box = await sampler.boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.locator('[data-testid^="color-item-"]').waitFor()
}

test.describe('Replace Image modal', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('File > Import Image without samples opens the file picker directly', async ({ page }) => {
    // No sampled colors → hasSamples = false → modal is skipped, file picker opens immediately
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Import Image…' }).click()
    const fileChooser = await fileChooserPromise
    expect(fileChooser).toBeTruthy()
  })

  test('File > Import Image with sampled colors shows the Replace Image modal', async ({ page }) => {
    await sampleAColor(page)
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Import Image…' }).click()
    await expect(page.getByRole('dialog', { name: 'Replace image?' })).toBeVisible()
  })

  test('Replace Image modal contains the expected warning text', async ({ page }) => {
    await sampleAColor(page)
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Import Image…' }).click()
    await expect(page.getByRole('dialog', { name: 'Replace image?' })).toContainText(
      'Replacing the image will clear your entire palette and all filters.'
    )
  })

  test('Cancel button closes the modal without replacing', async ({ page }) => {
    await sampleAColor(page)
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Import Image…' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog', { name: 'Replace image?' })).not.toBeVisible()
    // The sampled color should still be in the palette
    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(1)
  })

  test('Replace Anyway closes the modal and opens the file picker', async ({ page }) => {
    await sampleAColor(page)
    await page.getByRole('button', { name: 'File' }).click()
    await page.getByRole('menuitem', { name: 'Import Image…' }).click()
    await page.getByRole('dialog', { name: 'Replace image?' }).waitFor()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Replace Anyway' }).click()
    await fileChooserPromise

    await expect(page.getByRole('dialog', { name: 'Replace image?' })).not.toBeVisible()
  })
})
