import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Color groups', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  test('clicking Add Group creates a group item', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await expect(page.getByTestId('group-item')).toBeVisible()
  })

  test('new group name is auto-generated', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await page.getByTestId('group-item').waitFor()
    // Press Escape to exit the auto-edit input, then verify name text is shown
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('group-name')).toContainText('Group')
  })

  test('new group opens in edit mode', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await page.getByTestId('group-item').waitFor()
    // An input should be visible inside the group for renaming
    await expect(page.getByTestId('group-item').locator('input')).toBeVisible()
  })

  test('renaming a group via Enter updates the name', async ({ page }) => {
    await page.getByTestId('add-group').click()
    const input = page.getByTestId('group-item').locator('input')
    await input.fill('Shadows')
    await input.press('Enter')
    await expect(page.getByTestId('group-name')).toContainText('Shadows')
  })

  test('pressing Escape on new group name cancels edit and keeps auto-name', async ({ page }) => {
    await page.getByTestId('add-group').click()
    const input = page.getByTestId('group-item').locator('input')
    const autoName = await input.inputValue()
    await input.fill('Something else')
    await input.press('Escape')
    await expect(page.getByTestId('group-name')).toContainText(autoName)
  })

  test('clicking delete removes an empty group immediately', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await page.keyboard.press('Escape')
    await page.getByTestId('group-item').waitFor()
    await page.getByTestId('group-delete').click()
    await expect(page.getByTestId('group-item')).not.toBeAttached()
  })

  test('multiple groups can be added', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await page.keyboard.press('Escape')
    await page.getByTestId('add-group').click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('group-item')).toHaveCount(2)
  })

  test('"Ungrouped" label is not shown when no groups exist', async ({ page }) => {
    await expect(page.getByText('Ungrouped')).not.toBeAttached()
  })

  test('"Ungrouped" label appears once a group is added', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Ungrouped')).toBeVisible()
  })

  test('"Ungrouped" label disappears after the last group is deleted', async ({ page }) => {
    await page.getByTestId('add-group').click()
    await page.keyboard.press('Escape')
    await page.getByTestId('group-delete').click()
    await expect(page.getByText('Ungrouped')).not.toBeAttached()
  })
})
