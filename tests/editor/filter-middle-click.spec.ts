import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Middle-click to remove filter', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByTestId('filter-panel').waitFor()
  })

  test('middle-clicking a filter item removes it', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await page.getByTestId('filter-item').waitFor()

    const box = await page.getByTestId('filter-item').boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + 10, { button: 'middle' })

    await expect(page.getByTestId('filter-item')).not.toBeAttached()
    await expect(page.getByText('No filters added yet')).toBeVisible()
  })

  test('middle-clicking removes only the targeted filter when two exist', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()
    await expect(page.getByTestId('filter-item')).toHaveCount(2)

    // Middle-click the first filter (Brightness / Contrast)
    const box = await page.getByTestId('filter-item').first().boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + 10, { button: 'middle' })

    await expect(page.getByTestId('filter-item')).toHaveCount(1)
    await expect(page.getByTestId('filter-item').first()).toContainText('Blur')
  })
})
