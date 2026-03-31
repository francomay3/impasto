import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function sampleColor(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.keyboard.press('e')
  await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
  const sampler = page.getByTestId('sampler-overlay')
  const box = await sampler.boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
}

test.describe('Merge pins', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  test('merge button is not shown when selected colors have no pins', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-1').waitFor()

    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()

    await expect(page.getByTestId('selection-popover-merge')).not.toBeVisible()
  })

  test('merging two sampled pins produces one pin and removes the originals', async ({ page }) => {
    await sampleColor(page)
    await page.getByTestId('color-item-0').waitFor()
    await sampleColor(page)
    await page.getByTestId('color-item-1').waitFor()

    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()

    await expect(page.getByTestId('selection-popover-merge')).toBeVisible()
    await page.getByTestId('selection-popover-merge').click()

    await expect(page.locator('[data-testid^="color-item-"]')).toHaveCount(1)
    await expect(page.getByTestId('color-item-0')).toBeVisible()
    await expect(page.getByTestId('color-item-1')).not.toBeAttached()
  })

  test('selection is cleared after merging', async ({ page }) => {
    await sampleColor(page)
    await page.getByTestId('color-item-0').waitFor()
    await sampleColor(page)
    await page.getByTestId('color-item-1').waitFor()

    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()
    await page.getByTestId('selection-popover-merge').click()

    await expect(page.getByTestId('color-item-0')).not.toHaveAttribute('data-selected')
  })

  test('merge popover closes after merging', async ({ page }) => {
    await sampleColor(page)
    await page.getByTestId('color-item-0').waitFor()
    await sampleColor(page)
    await page.getByTestId('color-item-1').waitFor()

    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()
    await page.getByTestId('selection-popover-merge').click()

    await expect(page.getByTestId('selection-popover')).not.toBeAttached()
  })
})
