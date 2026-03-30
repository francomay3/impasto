import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Color selection', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    // Add two colors to work with
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-1').waitFor()
  })

  test('clicking a color selects it', async ({ page }) => {
    await page.getByTestId('color-item-0').click()
    await expect(page.getByTestId('color-item-0')).toHaveAttribute('data-selected', 'true')
  })

  test('clicking a color deselects the previously selected one', async ({ page }) => {
    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click()
    await expect(page.getByTestId('color-item-1')).toHaveAttribute('data-selected', 'true')
    await expect(page.getByTestId('color-item-0')).not.toHaveAttribute('data-selected', 'true')
  })

  test('clicking the sidebar background deselects the selected color', async ({ page }) => {
    await page.getByTestId('color-item-0').click()
    // Click the palette-sidebar container itself (not a color item)
    await page.getByTestId('palette-sidebar').click({ position: { x: 10, y: 10 } })
    await expect(page.getByTestId('color-item-0')).not.toHaveAttribute('data-selected', 'true')
  })

  test('cmd+click selects multiple colors', async ({ page }) => {
    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    await expect(page.getByTestId('color-item-0')).toHaveAttribute('data-selected', 'true')
    await expect(page.getByTestId('color-item-1')).toHaveAttribute('data-selected', 'true')
  })

  test('cmd+click on a selected color deselects it', async ({ page }) => {
    await page.getByTestId('color-item-0').click()
    await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
    // Both selected; cmd+click item-0 should deselect it
    await page.getByTestId('color-item-0').click({ modifiers: ['Meta'] })
    await expect(page.getByTestId('color-item-0')).not.toHaveAttribute('data-selected', 'true')
    await expect(page.getByTestId('color-item-1')).toHaveAttribute('data-selected', 'true')
  })

  test('clicking an already-selected sole color deselects it', async ({ page }) => {
    await page.getByTestId('color-item-0').click()
    await expect(page.getByTestId('color-item-0')).toHaveAttribute('data-selected', 'true')
    // Clicking the same color when it is the only selected item should deselect
    await page.getByTestId('color-item-0').click()
    await expect(page.getByTestId('color-item-0')).not.toHaveAttribute('data-selected', 'true')
  })
})
