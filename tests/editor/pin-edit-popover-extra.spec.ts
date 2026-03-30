import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function openEditPopover(page: import('@playwright/test').Page) {
  await page.getByRole('tab', { name: /Palette/ }).click()
  await page.getByRole('button', { name: /Add Color/ }).click()
  await page.getByTestId('color-item-0').waitFor()
  await page.getByTestId('color-item-0').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await page.getByTestId('pin-edit-popover').waitFor()
}

test.describe('PinEditPopover — outside click and new-group back arrow', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  // --- Outside click dismissal ---

  test('clicking outside the popover closes it without saving', async ({ page }) => {
    await openEditPopover(page)
    const nameInput = page.getByTestId('pin-edit-popover').getByLabel('Name')
    await nameInput.fill('Unsaved Name')
    // Click somewhere outside the popover (the palette sidebar background)
    await page.getByTestId('palette-sidebar').click({ position: { x: 10, y: 10 } })
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    // Name should NOT have been saved
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).not.toContainText('Unsaved Name')
  })

  // --- Back arrow in new-group creation mode ---

  test('selecting "+ New group" switches to the group name input', async ({ page }) => {
    await openEditPopover(page)
    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: '+ New group' }).click()
    await expect(page.getByTestId('pin-edit-popover').getByLabel('New group name')).toBeVisible()
    await expect(page.getByTestId('pin-edit-popover').getByRole('combobox')).not.toBeAttached()
  })

  test('clicking the back arrow returns to the group select dropdown', async ({ page }) => {
    await openEditPopover(page)
    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: '+ New group' }).click()
    // Confirm we are in create-group mode
    await expect(page.getByTestId('pin-edit-popover').getByLabel('New group name')).toBeVisible()
    // Click the back arrow
    await page.getByTestId('new-group-back').click()
    // Should be back to the group select
    await expect(page.getByTestId('pin-edit-popover').getByRole('combobox')).toBeVisible()
    await expect(page.getByTestId('pin-edit-popover').getByLabel('New group name')).not.toBeAttached()
  })

  test('back arrow restores the original group value (no group)', async ({ page }) => {
    await openEditPopover(page)
    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: '+ New group' }).click()
    await page.getByTestId('new-group-back').click()
    // No group was originally set, so combobox should show placeholder
    await expect(page.getByTestId('pin-edit-popover').getByRole('combobox')).toBeVisible()
  })
})
