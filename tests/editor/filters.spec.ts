import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Filter panel', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    // Filters tab is active by default
    await page.getByTestId('filter-panel').waitFor()
  })

  test('shows empty state when no filters have been added', async ({ page }) => {
    await expect(page.getByText('No filters added yet')).toBeVisible()
  })

  test('shows the Add Filter button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Filter/ })).toBeVisible()
  })

  test('clicking Add Filter opens a context menu', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await expect(page.getByRole('menuitem', { name: 'Brightness / Contrast' })).toBeVisible()
  })

  test('selecting Brightness / Contrast from the menu adds a filter item', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await expect(page.getByTestId('filter-item')).toBeVisible()
    await expect(page.getByTestId('filter-item')).toContainText('Brightness / Contrast')
  })

  test('the empty state disappears after adding a filter', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await expect(page.getByText('No filters added yet')).not.toBeVisible()
  })

  test('clicking the remove button deletes a filter', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await page.getByTestId('filter-item').waitFor()
    await page.getByTestId('filter-remove').click()
    await expect(page.getByTestId('filter-item')).not.toBeAttached()
  })

  test('the empty state reappears after removing the last filter', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await page.getByTestId('filter-item').waitFor()
    await page.getByTestId('filter-remove').click()
    await expect(page.getByText('No filters added yet')).toBeVisible()
  })

  test('can add multiple filter types', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()

    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Blur' }).click()

    await expect(page.getByTestId('filter-item')).toHaveCount(2)
  })

  test('right-clicking a filter item shows a context menu with Remove option', async ({ page }) => {
    await page.getByRole('button', { name: /Add Filter/ }).click()
    await page.getByRole('menuitem', { name: 'Brightness / Contrast' }).click()
    await page.getByTestId('filter-item').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Remove' })).toBeVisible()
  })
})
