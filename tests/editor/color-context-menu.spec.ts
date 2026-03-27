import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Color context menu', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
  })

  test('right-clicking a color opens the context menu', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Resample' })).toBeVisible()
  })

  test('context menu contains Copy hex option', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Copy hex' })).toBeVisible()
  })

  test('context menu contains Delete color option', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Delete color' })).toBeVisible()
  })

  test('clicking Delete color from context menu removes the color', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete color' }).click()
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
  })
})
