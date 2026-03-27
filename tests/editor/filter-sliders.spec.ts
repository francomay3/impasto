import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function addBrightnessFilter(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('button', { name: /Add Filter/ }).click()
  await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
  await page.getByTestId('filter-item').waitFor()
}

test.describe('Filter sliders', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
  })

  test('Brightness / Contrast filter shows two sliders', async ({ page }) => {
    await addBrightnessFilter(page)
    const filterItem = page.getByTestId('filter-item')
    await expect(filterItem.locator('[role="slider"]')).toHaveCount(2)
  })

  test('Brightness label is visible at default value', async ({ page }) => {
    await addBrightnessFilter(page)
    await expect(page.getByTestId('filter-item')).toContainText('Brightness: 0')
  })

  test('Contrast label is visible at default value', async ({ page }) => {
    await addBrightnessFilter(page)
    await expect(page.getByTestId('filter-item')).toContainText('Contrast: 0')
  })

  test('Blur filter shows one slider', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]')).toHaveCount(1)
  })

  test('Blur label is visible at default value', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item')).toContainText('Blur: 0')
  })
})
