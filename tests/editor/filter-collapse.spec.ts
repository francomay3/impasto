import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function addBrightnessFilter(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('button', { name: /Add Filter/ }).click()
  await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
  await page.getByTestId('filter-item').waitFor()
}

test.describe('Filter collapse / expand', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
    await addBrightnessFilter(page)
  })

  test('filter widget is expanded by default', async ({ page }) => {
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).toBeVisible()
  })

  test('clicking the toggle button collapses the filter widget', async ({ page }) => {
    await page.getByTestId('filter-toggle').click()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).not.toBeVisible()
  })

  test('clicking the toggle button again expands the filter widget', async ({ page }) => {
    await page.getByTestId('filter-toggle').click()
    await page.getByTestId('filter-toggle').click()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).toBeVisible()
  })

  test('double-clicking the filter header label collapses the widget', async ({ page }) => {
    await page.getByTestId('filter-item').getByText('Brightness / Contrast').dblclick()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]').first()).not.toBeVisible()
  })
})
