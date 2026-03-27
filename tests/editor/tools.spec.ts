import { test, expect } from '@playwright/test'
import { openEditorWithImage, activateTool } from '../helpers'

test.describe('Tool rail', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    // Tool rail is only available on the Palette tab
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('tool-select').waitFor()
  })

  test('select tool is active by default', async ({ page }) => {
    await expect(page.getByTestId('tool-select')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('tool-marquee')).not.toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('tool-eyedropper')).not.toHaveAttribute('data-active', 'true')
  })

  test('clicking marquee tool activates it and deactivates select', async ({ page }) => {
    await activateTool(page, 'marquee')
    await expect(page.getByTestId('tool-marquee')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('tool-select')).not.toHaveAttribute('data-active', 'true')
  })

  test('clicking select tool after marquee activates select', async ({ page }) => {
    await activateTool(page, 'marquee')
    await activateTool(page, 'select')
    await expect(page.getByTestId('tool-select')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('tool-marquee')).not.toHaveAttribute('data-active', 'true')
  })

  test('clicking eyedropper tool activates it', async ({ page }) => {
    await activateTool(page, 'eyedropper')
    await expect(page.getByTestId('tool-eyedropper')).toHaveAttribute('data-active', 'true')
    await expect(page.getByTestId('tool-select')).not.toHaveAttribute('data-active', 'true')
  })

  test('pressing s activates the marquee tool', async ({ page }) => {
    await page.keyboard.press('s')
    await expect(page.getByTestId('tool-marquee')).toHaveAttribute('data-active', 'true')
  })

  test('pressing v activates the select tool', async ({ page }) => {
    // Put marquee active first so we have something to switch away from
    await activateTool(page, 'marquee')
    await page.keyboard.press('v')
    await expect(page.getByTestId('tool-select')).toHaveAttribute('data-active', 'true')
  })

  test('pressing e activates the eyedropper tool', async ({ page }) => {
    // 'e' calls handleEnterAddColorMode which sets tool to eyedropper
    await page.keyboard.press('e')
    await expect(page.getByTestId('tool-eyedropper')).toHaveAttribute('data-active', 'true')
  })

  test('only one tool is active at a time', async ({ page }) => {
    await activateTool(page, 'marquee')
    // Scope to tool buttons only — Mantine Tabs also uses data-active on the active tab
    await expect(page.locator('[data-testid^="tool-"][data-active="true"]')).toHaveCount(1)
  })
})
