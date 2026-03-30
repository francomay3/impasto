import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Filter slider reset button', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await page.getByTestId('filter-item').waitFor()
  })

  test('reset button is not visible when slider is at default value', async ({ page }) => {
    // Default Brightness = 0; no reset button should be shown
    const slider = page.getByRole('slider', { name: 'Brightness' })
    await expect(slider).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset Brightness' })).not.toBeAttached()
  })

  test('reset button appears after changing a slider from its default', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Brightness' })
    await slider.focus()
    await slider.press('ArrowRight')
    await expect(page.getByRole('button', { name: 'Reset Brightness' })).toBeVisible()
  })

  test('clicking reset button returns the slider to its default value', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Brightness' })
    await slider.focus()
    // Press ArrowRight multiple times to move away from 0
    for (let i = 0; i < 5; i++) await slider.press('ArrowRight')
    await expect(page.getByTestId('filter-item')).not.toContainText('Brightness: 0')

    await page.getByRole('button', { name: 'Reset Brightness' }).click()
    await expect(page.getByTestId('filter-item')).toContainText('Brightness: 0')
  })

  test('reset button disappears after resetting to default', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Brightness' })
    await slider.focus()
    await slider.press('ArrowRight')
    await page.getByRole('button', { name: 'Reset Brightness' }).click()
    await expect(page.getByRole('button', { name: 'Reset Brightness' })).not.toBeAttached()
  })

  test('each slider has an independent reset button', async ({ page }) => {
    const brightnessSlider = page.getByRole('slider', { name: 'Brightness' })
    const contrastSlider = page.getByRole('slider', { name: 'Contrast' })
    await brightnessSlider.focus()
    await brightnessSlider.press('ArrowRight')
    // Only Brightness reset should appear, not Contrast
    await expect(page.getByRole('button', { name: 'Reset Brightness' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset Contrast' })).not.toBeAttached()

    await contrastSlider.focus()
    await contrastSlider.press('ArrowLeft')
    // Now both reset buttons should be visible
    await expect(page.getByRole('button', { name: 'Reset Brightness' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset Contrast' })).toBeVisible()
  })
})
