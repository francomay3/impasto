import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

async function openEditPopover(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByRole('tab', { name: /Palette/ }).click()
  await page.getByRole('button', { name: /Add Color/ }).click()
  await page.getByTestId('color-item-0').waitFor()
  await page.getByTestId('color-item-0').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await page.getByTestId('pin-edit-popover').waitFor()
}

test.describe('Pin Edit Popover', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('"Edit" option appears in the color context menu', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible()
  })

  test('clicking Edit opens the pin edit popover', async ({ page }) => {
    await openEditPopover(page)
    await expect(page.getByTestId('pin-edit-popover')).toBeVisible()
    await expect(page.getByTestId('pin-edit-popover')).toContainText('Edit color')
  })

  test('popover has a Name input', async ({ page }) => {
    await openEditPopover(page)
    await expect(page.getByTestId('pin-edit-popover').getByLabel('Name')).toBeVisible()
  })

  test('popover has a Group select', async ({ page }) => {
    await openEditPopover(page)
    await expect(page.getByTestId('pin-edit-popover').getByLabel('Group')).toBeVisible()
  })

  test('typing a name and clicking Save updates the color name', async ({ page }) => {
    await openEditPopover(page)
    const nameInput = page.getByTestId('pin-edit-popover').getByLabel('Name')
    await nameInput.fill('Burnt Sienna')
    await page.getByTestId('pin-edit-popover').getByRole('button', { name: 'Save' }).click()
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText('Burnt Sienna')
  })

  test('clicking Cancel closes the popover without changing the name', async ({ page }) => {
    await openEditPopover(page)
    const originalName = await page.getByTestId('color-item-0').getByTestId('color-name').textContent()
    const nameInput = page.getByTestId('pin-edit-popover').getByLabel('Name')
    await nameInput.fill('Should Not Stick')
    await page.getByTestId('pin-edit-popover').getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText(originalName ?? '')
  })

  test('pressing Enter in the name input saves and closes the popover', async ({ page }) => {
    await openEditPopover(page)
    const nameInput = page.getByTestId('pin-edit-popover').getByLabel('Name')
    await nameInput.fill('Raw Umber')
    await nameInput.press('Enter')
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText('Raw Umber')
  })

  test('pressing Escape closes the popover without saving', async ({ page }) => {
    await openEditPopover(page)
    const originalName = await page.getByTestId('color-item-0').getByTestId('color-name').textContent()
    await page.getByTestId('pin-edit-popover').getByLabel('Name').fill('Discard Me')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('pin-edit-popover')).not.toBeAttached()
    await expect(page.getByTestId('color-item-0').getByTestId('color-name')).toContainText(originalName ?? '')
  })

  test('"Remove pin" appears in context menu only for sampled colors', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()

    // Manually added color has no sample — no Remove pin option
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Remove pin' })).not.toBeAttached()
    await page.keyboard.press('Escape')

    // Sample a color — Remove pin should appear
    await page.keyboard.press('e')
    await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
    const box = await page.getByTestId('sampler-overlay').boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.locator('[data-testid^="color-item-"]').nth(1).waitFor()

    await page.locator('[data-testid^="color-item-"]').last().click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Remove pin' })).toBeVisible()
  })

  test('"Remove pin" removes the sample from the color', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.keyboard.press('e')
    await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
    const box = await page.getByTestId('sampler-overlay').boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.locator('[data-testid^="color-item-"]').waitFor()

    await page.getByTestId('color-item-0').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Remove pin' }).click()

    // After removing the pin, Remove pin should no longer appear on right-click
    await page.getByTestId('color-item-0').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Remove pin' })).not.toBeAttached()
  })
})
