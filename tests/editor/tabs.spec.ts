import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Editor tabs', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('filter panel is visible on the Filters tab', async ({ page }) => {
    await expect(page.getByTestId('filter-panel')).toBeVisible()
  })

  test('palette sidebar is not visible on the Filters tab', async ({ page }) => {
    await expect(page.getByTestId('palette-sidebar')).not.toBeVisible()
  })

  test('clicking Palette tab shows the palette sidebar', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await expect(page.getByTestId('palette-sidebar')).toBeVisible()
  })

  test('clicking Palette tab hides the filter panel', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await expect(page.getByTestId('filter-panel')).not.toBeVisible()
  })

  test('clicking back to Filters tab shows the filter panel again', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByRole('tab', { name: /Filters/ }).click()
    await expect(page.getByTestId('filter-panel')).toBeVisible()
  })

  test('disabled tabs have the disabled attribute', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Values/ })).toBeDisabled()
    await expect(page.getByRole('tab', { name: /Composition/ })).toBeDisabled()
    await expect(page.getByRole('tab', { name: /Color Study/ })).toBeDisabled()
    await expect(page.getByRole('tab', { name: /Paint/ })).toBeDisabled()
  })

  test('tool rail is only visible on the Palette tab', async ({ page }) => {
    await expect(page.getByTestId('tool-select')).not.toBeVisible()
    await page.getByRole('tab', { name: /Palette/ }).click()
    await expect(page.getByTestId('tool-select')).toBeVisible()
  })
})
