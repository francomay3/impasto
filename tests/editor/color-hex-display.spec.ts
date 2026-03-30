import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Color item secondary hex and save status', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
  })

  // --- Secondary hex display ---

  test('hex code is not shown as secondary text when no custom name is set', async ({ page }) => {
    // Default state: no custom name → color-hex not rendered
    await expect(page.getByTestId('color-item-0').getByTestId('color-hex')).not.toBeAttached()
  })

  test('hex code appears as secondary text after setting a custom name', async ({ page }) => {
    await page.getByTestId('color-item-0').getByTestId('color-name').click()
    const input = page.getByTestId('color-item-0').locator('input')
    await input.fill('Cadmium Red')
    await input.press('Enter')

    const hexEl = page.getByTestId('color-item-0').getByTestId('color-hex')
    await expect(hexEl).toBeVisible()
    // The secondary hex must start with #
    const hexText = await hexEl.textContent()
    expect(hexText).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test('secondary hex disappears when the custom name is cleared', async ({ page }) => {
    // Set a name
    await page.getByTestId('color-item-0').getByTestId('color-name').click()
    const input = page.getByTestId('color-item-0').locator('input')
    await input.fill('Cadmium Red')
    await input.press('Enter')
    await expect(page.getByTestId('color-item-0').getByTestId('color-hex')).toBeVisible()

    // Clear the name (submit empty string → falls back to hex-as-name)
    await page.getByTestId('color-item-0').getByTestId('color-name').click()
    const input2 = page.getByTestId('color-item-0').locator('input')
    await input2.fill('')
    await input2.press('Enter')

    await expect(page.getByTestId('color-item-0').getByTestId('color-hex')).not.toBeAttached()
  })

  // --- Save status indicator ---

  test('save status indicator shows "Saved" after the editor loads', async ({ page }) => {
    await expect(page.getByTestId('save-status')).toContainText('Saved')
  })
})
