import { test, expect } from '@playwright/test'
import { openEditorWithImage, activateTool } from '../helpers'

const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

test.describe('Additional keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  // --- X: delete selected color ---

  test('pressing X deletes the selected color', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').click()
    await page.keyboard.press('x')
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
  })

  test('pressing X with no color selected does nothing', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    // Deselect by clicking sidebar background
    await page.getByTestId('palette-sidebar').click({ position: { x: 10, y: 10 } })
    await page.keyboard.press('x')
    await expect(page.getByTestId('color-item-0')).toBeVisible()
  })

  // --- mod+F: open filter add menu ---

  test('pressing mod+F opens the filter context menu', async ({ page }) => {
    await page.keyboard.press(`${mod}+f`)
    await expect(page.getByRole('menuitem', { name: 'Brightness / Contrast' })).toBeVisible()
  })

  test('selecting a filter type from the mod+F menu adds that filter', async ({ page }) => {
    await page.keyboard.press(`${mod}+f`)
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await expect(page.getByTestId('filter-item')).toBeVisible()
    await expect(page.getByTestId('filter-item')).toContainText('Brightness / Contrast')
  })

  // --- mod+S: save notification ---

  test('pressing mod+S shows a "Project saved" notification', async ({ page }) => {
    await page.keyboard.press(`${mod}+s`)
    await expect(page.getByText('Project saved')).toBeVisible()
  })

  // --- Escape: clear selection and reset tool ---

  test('pressing Escape deselects the selected color', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').click()
    await expect(page.getByTestId('color-item-0')).toHaveAttribute('data-selected', 'true')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('color-item-0')).not.toHaveAttribute('data-selected', 'true')
  })

  test('pressing Escape resets an active non-select tool back to select', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await activateTool(page, 'marquee')
    await expect(page.getByTestId('tool-marquee')).toHaveAttribute('data-active', 'true')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('tool-select')).toHaveAttribute('data-active', 'true')
  })

  // --- X: delete multiple selected colors ---

  test('pressing X with multiple colors selected deletes all of them', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-1').waitFor()
    // Select both with cmd+click
    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    await expect(page.getByTestId('color-item-0')).toHaveAttribute('data-selected', 'true')
    await expect(page.getByTestId('color-item-1')).toHaveAttribute('data-selected', 'true')
    await page.keyboard.press('x')
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
    await expect(page.getByTestId('color-item-1')).not.toBeAttached()
  })
})
