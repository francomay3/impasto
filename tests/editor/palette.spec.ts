import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Palette sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  test('shows the Add Color button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Color/ })).toBeVisible()
  })

  test('clicking Add Color adds a color item to the palette', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await expect(page.getByTestId('color-item-0')).toBeVisible()
  })

  test('new color item shows its hex code as the name', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    // New color has no custom name, so the hex code is shown in the name slot
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText('#')
  })

  test('clicking delete button removes the color from the palette', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').getByTestId('color-delete').click()
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
  })

  test('clicking the color name enters edit mode', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').getByTestId('color-name').click()
    await expect(page.getByTestId('color-item-0').locator('input')).toBeVisible()
  })

  test('typing a name and pressing Enter renames the color', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').getByTestId('color-name').click()
    const input = page.getByTestId('color-item-0').locator('input')
    await input.fill('Cadmium Red')
    await input.press('Enter')
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText('Cadmium Red')
  })

  test('pressing Escape cancels renaming without changing the name', async ({ page }) => {
    await page.getByRole('button', { name: /Add Color/ }).click()
    const originalName = await page.getByTestId('color-item-0').getByTestId('color-name').textContent()
    await page.getByTestId('color-item-0').getByTestId('color-name').click()
    const input = page.getByTestId('color-item-0').locator('input')
    await input.fill('Some Other Name')
    await input.press('Escape')
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText(originalName ?? '')
  })

  test('pressing c enters eyedropper mode', async ({ page }) => {
    await page.keyboard.press('c')
    await expect(page.getByTestId('tool-eyedropper')).toHaveAttribute('data-active', 'true')
  })
})
