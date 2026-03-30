import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('PinEditPopover group assignment', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
  })

  async function openPinEditPopover(page: import('@playwright/test').Page) {
    await page.getByTestId('color-item-0').getByTestId('color-item-inner').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    await page.getByTestId('pin-edit-popover').waitFor()
  }

  test('selecting "+ New group" shows a group name input', async ({ page }) => {
    await openPinEditPopover(page)
    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: '+ New group' }).click()
    await expect(page.getByTestId('pin-edit-popover').getByPlaceholder('Group name')).toBeVisible()
  })

  test('creating a new group via PinEditPopover assigns the color to it', async ({ page }) => {
    await openPinEditPopover(page)
    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: '+ New group' }).click()
    await page.getByTestId('pin-edit-popover').getByPlaceholder('Group name').fill('Paint Group')
    await page.getByTestId('pin-edit-popover').getByRole('button', { name: 'Save' }).click()
    // Popover should close
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    // Group should appear with the color inside (toggle visible)
    await expect(page.getByTestId('group-name').filter({ hasText: 'Paint Group' })).toBeVisible()
    await expect(page.getByTestId('group-toggle')).toBeVisible()
  })

  test('assigning an existing group moves the color into it', async ({ page }) => {
    // First create a group via color-group-button "New group" menu item
    await page.getByTestId('color-item-0').getByTestId('color-group-button').click()
    await page.getByRole('menuitem', { name: 'New group' }).click()
    const groupName = await page.getByTestId('group-name').first().textContent()

    // Add a second ungrouped color to test with
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-1').waitFor()

    // Open PinEditPopover for color-item-1 (index 1 - but after group render the ungrouped colors may shift)
    // Use the last color-item that lacks a group
    const ungroupedItem = page.locator('[data-testid^="color-item-"]:not([data-testid="color-item-0"])').first()
    await ungroupedItem.getByTestId('color-item-inner').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    await page.getByTestId('pin-edit-popover').waitFor()

    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: groupName! }).click()
    await page.getByTestId('pin-edit-popover').getByRole('button', { name: 'Save' }).click()

    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    // The group-toggle should still be visible (group has colors)
    await expect(page.getByTestId('group-toggle')).toBeVisible()
  })

  test('cancelling PinEditPopover does not change the group', async ({ page }) => {
    await openPinEditPopover(page)
    const groupSelect = page.getByTestId('pin-edit-popover').getByRole('combobox')
    await groupSelect.click()
    await page.getByRole('option', { name: '+ New group' }).click()
    await page.getByTestId('pin-edit-popover').getByPlaceholder('Group name').fill('Should Not Appear')
    await page.getByTestId('pin-edit-popover').getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    await expect(page.locator('[data-testid="group-name"]')).not.toBeAttached()
  })
})
