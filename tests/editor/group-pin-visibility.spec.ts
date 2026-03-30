import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

/**
 * Sets up a group containing one sampled color.
 * After this, `group-pin-visibility-toggle` is visible on the group header.
 */
async function setupGroupWithSampledColor(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('tab', { name: /Palette/ }).click()

  // Add a group
  await page.getByTestId('add-group').click()
  await page.getByTestId('group-item').waitFor()
  await page.keyboard.press('Escape')
  await page.getByTestId('group-name').waitFor()

  // Sample a color via the eyedropper
  await page.keyboard.press('e')
  await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
  const sampler = page.getByTestId('sampler-overlay')
  const box = await sampler.boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.locator('[data-testid^="color-item-"]').waitFor()

  // Assign the sampled color to the group via the Move to group button
  await page.getByTestId('color-item-0').getByTestId('color-group-button').click()
  await page.getByRole('menuitem', { name: 'Group 1' }).click()

  // Wait for the group toggle to appear (confirms colorCount > 0)
  await page.getByTestId('group-toggle').waitFor()
}

test.describe('Group-level pin visibility toggle', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('group pin visibility toggle is visible when the group contains a sampled color', async ({ page }) => {
    await setupGroupWithSampledColor(page)
    await expect(page.getByTestId('group-pin-visibility-toggle')).toBeVisible()
  })

  test('group pin visibility toggle is not visible when the group has no sampled colors', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('add-group').click()
    await page.keyboard.press('Escape')
    // Add a plain (non-sampled) color and assign it to the group
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').getByTestId('color-group-button').click()
    await page.getByRole('menuitem', { name: 'Group 1' }).click()
    await page.getByTestId('group-toggle').waitFor()
    await expect(page.getByTestId('group-pin-visibility-toggle')).not.toBeAttached()
  })

  test('group pin is visible by default (no data-hidden)', async ({ page }) => {
    await setupGroupWithSampledColor(page)
    await expect(page.getByTestId('group-pin-visibility-toggle')).not.toHaveAttribute('data-hidden')
  })

  test('clicking the group toggle hides all group pins', async ({ page }) => {
    await setupGroupWithSampledColor(page)
    await page.getByTestId('group-pin-visibility-toggle').click()
    await expect(page.getByTestId('group-pin-visibility-toggle')).toHaveAttribute('data-hidden', 'true')
    // The individual color's toggle should also reflect the hidden state
    await expect(page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')).toHaveAttribute('data-hidden', 'true')
  })

  test('clicking the group toggle again shows all group pins', async ({ page }) => {
    await setupGroupWithSampledColor(page)
    const groupToggle = page.getByTestId('group-pin-visibility-toggle')
    await groupToggle.click()
    await groupToggle.click()
    await expect(groupToggle).not.toHaveAttribute('data-hidden')
    await expect(page.getByTestId('color-item-0').getByTestId('pin-visibility-toggle')).not.toHaveAttribute('data-hidden')
  })
})
