import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

/** Add a group and confirm its auto-generated name. */
async function addGroup(page: Parameters<typeof openEditorWithImage>[0]) {
  await page.getByTestId('add-group').click()
  await page.getByTestId('group-item').waitFor()
  await page.keyboard.press('Escape')
  await page.getByTestId('group-name').waitFor()
}

/** Add a color and assign it to the first group via the Move to group button. */
async function addColorToGroup(page: Parameters<typeof openEditorWithImage>[0], groupName: string) {
  await page.getByRole('button', { name: /Add Color/ }).click()
  await page.getByTestId('color-item-0').waitFor()
  await page.getByTestId('color-item-0').getByTestId('color-group-button').click()
  await page.getByRole('menuitem', { name: groupName }).click()
}

test.describe('Group advanced — collapse, rename, context menu, confirm delete', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  // --- Move to group button ---

  test('clicking Move to group button opens the group assignment menu', async ({ page }) => {
    await addGroup(page)
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-0').waitFor()
    await page.getByTestId('color-item-0').getByTestId('color-group-button').click()
    await expect(page.getByRole('menuitem', { name: 'Group 1' })).toBeVisible()
  })

  test('assigning a color to a group places it inside that group', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    // The group now shows a toggle (colorCount > 0)
    await expect(page.getByTestId('group-toggle')).toBeVisible()
  })

  // --- Group collapse / expand ---

  test('clicking the group toggle collapses the group (hides color items)', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-toggle').click()
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
  })

  test('clicking the group toggle again expands the group', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-toggle').click()
    await page.getByTestId('group-toggle').click()
    await expect(page.getByTestId('color-item-0')).toBeVisible()
  })

  test('group context menu shows Collapse when group is expanded', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-header').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Collapse' })).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('Collapse from context menu hides the color items', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-header').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Collapse' }).click()
    await expect(page.getByTestId('color-item-0')).not.toBeAttached()
  })

  test('group context menu shows Expand when group is collapsed', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-toggle').click()
    await page.getByTestId('group-item').click({ button: 'right' })
    await expect(page.getByRole('menuitem', { name: 'Expand' })).toBeVisible()
    await page.keyboard.press('Escape')
  })

  // --- Group context menu — Rename ---

  test('Rename from context menu puts the group into edit mode', async ({ page }) => {
    await addGroup(page)
    await page.getByTestId('group-item').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    await expect(page.getByTestId('group-item').locator('input')).toBeVisible()
  })

  test('renaming a group via context menu updates the name', async ({ page }) => {
    await addGroup(page)
    await page.getByTestId('group-item').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    const input = page.getByTestId('group-item').locator('input')
    await input.fill('Shadows')
    await input.press('Enter')
    await expect(page.getByTestId('group-name')).toContainText('Shadows')
  })

  // --- Confirm delete for non-empty groups ---

  test('deleting a non-empty group shows a confirm dialog', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-delete').click()
    await expect(page.getByRole('dialog', { name: 'Delete group' })).toBeVisible()
  })

  test('Cancel on the confirm dialog keeps the group', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-delete').click()
    await page.getByRole('dialog', { name: 'Delete group' }).getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('group-item')).toBeVisible()
  })

  test('Confirm on the delete dialog removes the group and ungroups its colors', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-delete').click()
    await page.getByRole('dialog', { name: 'Delete group' }).getByRole('button', { name: 'Confirm' }).click()
    await expect(page.getByTestId('group-item')).not.toBeAttached()
    // The color should still exist in the ungrouped section
    await expect(page.getByTestId('color-item-0')).toBeVisible()
  })

  test('context menu Delete group on non-empty group also shows confirm dialog', async ({ page }) => {
    await addGroup(page)
    await addColorToGroup(page, 'Group 1')
    await page.getByTestId('group-header').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete group' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete group' })).toBeVisible()
    await page.keyboard.press('Escape')
  })
})
