import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Filter types — Hue/Saturation and Levels', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
  })

  test('Hue / Saturation filter shows three sliders', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Hue / Saturation' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]')).toHaveCount(3)
  })

  test('Hue / Saturation shows Saturation label at default value', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Hue / Saturation' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item')).toContainText('Saturation: 0')
  })

  test('Hue / Saturation shows Temperature label at default value', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Hue / Saturation' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item')).toContainText('Temperature: 0')
  })

  test('Hue / Saturation shows Tint label at default value', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Hue / Saturation' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item')).toContainText('Tint: 0')
  })

  test('Levels filter shows two sliders', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Levels' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item').locator('[role="slider"]')).toHaveCount(2)
  })

  test('Levels shows Black Point label at default value', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Levels' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item')).toContainText('Black Point: 0')
  })

  test('Levels shows White Point label at default value', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Levels' }).click()
    await page.getByTestId('filter-item').waitFor()
    await expect(page.getByTestId('filter-item')).toContainText('White Point: 255')
  })
})
