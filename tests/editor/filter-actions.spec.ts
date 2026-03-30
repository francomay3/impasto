import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function addBrightnessFilter(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('button', { name: /Add Filter/ }).click()
  await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
  await page.getByTestId('filter-item').waitFor()
}

test.describe('Filter context menu actions', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
  })

  test('Duplicate creates a second filter of the same type', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByTestId('filter-item').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Duplicate' }).click()
    await expect(page.getByTestId('filter-item')).toHaveCount(2)
    await expect(page.getByTestId('filter-item').nth(1)).toContainText('Brightness / Contrast')
  })

  test('Move up is disabled when filter is first in the list', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByTestId('filter-item').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Move up' })).toHaveAttribute('data-disabled', 'true')
    await page.keyboard.press('Escape')
  })

  test('Move down is disabled when filter is last in the list', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByTestId('filter-item').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Move down' })).toHaveAttribute('data-disabled', 'true')
    await page.keyboard.press('Escape')
  })

  test('Move down reorders two filters', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await expect(page.getByTestId('filter-item')).toHaveCount(2)

    // Right-click first filter (Brightness / Contrast) and move it down
    await page.getByTestId('filter-item').first().click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Move down' }).click()

    await expect(page.getByTestId('filter-item').first()).toContainText('Blur')
    await expect(page.getByTestId('filter-item').nth(1)).toContainText('Brightness / Contrast')
  })

  test('Move up reorders two filters', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await expect(page.getByTestId('filter-item')).toHaveCount(2)

    // Right-click second filter (Blur) and move it up
    await page.getByTestId('filter-item').nth(1).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Move up' }).click()

    await expect(page.getByTestId('filter-item').first()).toContainText('Blur')
    await expect(page.getByTestId('filter-item').nth(1)).toContainText('Brightness / Contrast')
  })

  test('Collapse from context menu hides the filter widget', async ({ page }) => {
    await addBrightnessFilter(page)
    await page.getByTestId('filter-item').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Collapse' }).click()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).not.toBeVisible()
  })

  test('Expand from context menu shows the filter widget again', async ({ page }) => {
    await addBrightnessFilter(page)
    // First collapse via toggle
    await page.getByTestId('filter-toggle').click()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).not.toBeVisible()
    // Then expand via context menu
    await page.getByTestId('filter-item').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Expand' }).click()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).toBeVisible()
  })
})
