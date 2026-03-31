import { test, expect } from '@playwright/test';
import { openEditorWithImage, activateTool } from '../helpers';

test.describe('Contextual toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page);
  });

  // --- Filters tab ---

  test('Filters tab shows Compare button', async ({ page }) => {
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Compare' })).toBeVisible();
  });

  test('Filters tab shows Reset button', async ({ page }) => {
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('Filters tab does not show palette-only controls', async ({ page }) => {
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Select All' })).not.toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Add to Selection' })).not.toBeVisible();
  });

  // --- Palette tab ---

  test('Palette tab shows sort button in palette sidebar', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    await expect(page.getByTestId('sort-palette')).toBeVisible();
  });

  test('Palette tab shows Pre-index blur label', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByText('Pre-index blur')).toBeVisible();
  });

  test('Palette tab does not show filter-only controls', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Compare' })).not.toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Reset' })).not.toBeVisible();
  });

  // --- Palette tab — tool-dependent options ---

  test('Palette tab with select tool shows Select All and Deselect', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    // select tool is active by default
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Select All' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Deselect' })).toBeVisible();
  });

  test('Palette tab with marquee tool shows Add to Selection and Subtract', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    await activateTool(page, 'marquee');
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Add to Selection' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Subtract' })).toBeVisible();
  });

  test('Palette tab with eyedropper tool shows Sampling radius label', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    await activateTool(page, 'eyedropper');
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByText('Sampling radius')).toBeVisible();
  });

  test('switching from marquee to select updates the tool options', async ({ page }) => {
    await page.getByRole('tab', { name: /Palette/ }).click();
    await activateTool(page, 'marquee');
    await activateTool(page, 'select');
    const toolbar = page.getByTestId('contextual-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Select All' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: 'Add to Selection' })).not.toBeVisible();
  });
});
