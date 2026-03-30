import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function addTwoColors(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('button', { name: /Add Color/ }).click()
  await page.getByTestId('color-item-0').waitFor()
  await page.getByRole('button', { name: /Add Color/ }).click()
  await page.getByTestId('color-item-1').waitFor()
}

async function selectBoth(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByTestId('color-item-0').click()
  await page.getByTestId('color-item-1').click({ modifiers: ['Meta'] })
}

test.describe('Multi-selection popover', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    await addTwoColors(page)
    await selectBoth(page)
  })

  test('right-clicking a selected color when 2+ are selected opens the selection popover', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByTestId('selection-popover')).toBeVisible()
  })

  test('selection popover shows the correct count', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByTestId('selection-popover')).toContainText('2 colors selected')
  })

  test('clicking the X button closes the selection popover', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()
    await page.getByTestId('selection-popover-close').click()
    await expect(page.getByTestId('selection-popover')).not.toBeAttached()
  })

  test('clicking outside the popover closes it', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()
    // Click the backdrop (the inset:0 div that covers everything)
    await page.mouse.click(5, 5)
    await expect(page.getByTestId('selection-popover')).not.toBeAttached()
  })

  test('selection popover has a Group select dropdown', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByTestId('selection-popover').getByLabel('Group')).toBeVisible()
  })

  test('selection popover has a New group input', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByTestId('selection-popover').getByLabel('New group')).toBeVisible()
  })

  test('deleting from the popover removes all selected colors', async ({ page }) => {
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()
    await page.getByTestId('selection-popover-delete').click()
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
    await expect(page.getByTestId('color-item-1')).not.toBeAttached()
  })

  test('right-clicking a non-selected color while others are selected opens the regular context menu', async ({ page }) => {
    // color-item-1 is selected; clicking color-item-0 without holding meta deselects item-1
    // Then right-clicking should open the regular color menu (not the selection popover)
    await page.getByTestId('color-item-0').click() // deselects item-1, selects only item-0
    await page.getByTestId('color-item-0').click({ button: 'right' })
    // Should open regular context menu (Resample), not selection popover
    await expect(page.getByRole('menuitem', { name: 'Resample' })).toBeVisible()
    await expect(page.getByTestId('selection-popover')).not.toBeAttached()
  })
})
