import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Multi-selection group creation', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
    // Add two colors
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByRole('button', { name: /Add Color/ }).click()
    await page.getByTestId('color-item-1').waitFor()
  })

  async function openSelectionPopover(page: import('@playwright/test').Page) {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
    // Select first color
    await page.getByTestId('color-item-0').getByTestId('color-item-inner').click()
    // Cmd+click second color to add to selection
    await page.getByTestId('color-item-1').getByTestId('color-item-inner').click({ modifiers: [mod] })
    // Right-click to open selection popover
    await page.getByTestId('color-item-0').getByTestId('color-item-inner').click({ button: 'right' })
    await page.getByTestId('selection-popover').waitFor()
  }

  test('selection popover shows the correct color count', async ({ page }) => {
    await openSelectionPopover(page)
    await expect(page.getByTestId('selection-popover')).toContainText('2 colors selected')
  })

  test('Add button is disabled when group name is empty', async ({ page }) => {
    await openSelectionPopover(page)
    const addButton = page.getByTestId('selection-popover').getByRole('button', { name: 'Add' })
    await expect(addButton).toBeDisabled()
  })

  test('creating a new group via the popover assigns all selected colors to it', async ({ page }) => {
    await openSelectionPopover(page)
    const newGroupInput = page.getByTestId('selection-popover').getByPlaceholder('Group name')
    await newGroupInput.fill('My Group')
    await page.getByTestId('selection-popover').getByRole('button', { name: 'Add' }).click()
    // Popover should close
    await expect(page.getByTestId('selection-popover')).not.toBeAttached()
    // Group should now appear in the palette with a toggle (colorCount > 0)
    await expect(page.getByTestId('group-name').filter({ hasText: 'My Group' })).toBeVisible()
    await expect(page.getByTestId('group-toggle')).toBeVisible()
  })

  test('pressing Enter in the new group input creates the group', async ({ page }) => {
    await openSelectionPopover(page)
    const newGroupInput = page.getByTestId('selection-popover').getByPlaceholder('Group name')
    await newGroupInput.fill('Enter Group')
    await newGroupInput.press('Enter')
    await expect(page.getByTestId('selection-popover')).not.toBeAttached()
    await expect(page.getByTestId('group-name').filter({ hasText: 'Enter Group' })).toBeVisible()
  })
})
