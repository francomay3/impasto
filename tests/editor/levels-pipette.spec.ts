import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function addLevelsFilter(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('button', { name: /Add Filter/ }).click()
  await page.getByRole('menuitem', { name: 'Levels' }).click()
  await page.getByTestId('filter-item').waitFor()
}

test.describe('Levels filter pipette buttons', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
    await addLevelsFilter(page)
  })

  test('Black Point pipette button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sample Black Point from image' })).toBeVisible()
  })

  test('White Point pipette button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sample White Point from image' })).toBeVisible()
  })

  test('clicking Black Point pipette shows the sampler overlay', async ({ page }) => {
    await page.getByRole('button', { name: 'Sample Black Point from image' }).click()
    await expect(page.getByTestId('sampler-overlay')).toBeVisible()
  })

  test('clicking White Point pipette shows the sampler overlay', async ({ page }) => {
    await page.getByRole('button', { name: 'Sample White Point from image' }).click()
    await expect(page.getByTestId('sampler-overlay')).toBeVisible()
  })

  test('Black Point and White Point reset buttons appear after moving sliders', async ({ page }) => {
    const blackSlider = page.getByRole('slider', { name: 'Black Point' })
    await blackSlider.focus()
    await blackSlider.press('ArrowRight')
    await expect(page.getByRole('button', { name: 'Reset Black Point' })).toBeVisible()
  })

  test('clicking reset on Black Point returns it to 0', async ({ page }) => {
    const blackSlider = page.getByRole('slider', { name: 'Black Point' })
    await blackSlider.focus()
    for (let i = 0; i < 5; i++) await blackSlider.press('ArrowRight')
    await expect(page.getByTestId('filter-item')).not.toContainText('Black Point: 0')
    await page.getByRole('button', { name: 'Reset Black Point' }).click()
    await expect(page.getByTestId('filter-item')).toContainText('Black Point: 0')
  })

  test('clicking reset on White Point returns it to 255', async ({ page }) => {
    const whiteSlider = page.getByRole('slider', { name: 'White Point' })
    await whiteSlider.focus()
    for (let i = 0; i < 5; i++) await whiteSlider.press('ArrowLeft')
    await expect(page.getByTestId('filter-item')).not.toContainText('White Point: 255')
    await page.getByRole('button', { name: 'Reset White Point' }).click()
    await expect(page.getByTestId('filter-item')).toContainText('White Point: 255')
  })
})
