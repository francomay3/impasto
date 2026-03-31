import { test, expect } from '@playwright/test';
import { openDashboard, MOCK_PROJECTS } from '../helpers';

test.describe('Project card menu', () => {
  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('clicking the menu trigger does not navigate to the project', async ({ page }) => {
    await page.getByTestId('project-card-menu').first().click();
    await expect(page).toHaveURL('/');
  });

  test('clicking Delete shows a confirmation dialog', async ({ page }) => {
    await page.getByTestId('project-card-menu').first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('clicking Delete does not navigate to the project', async ({ page }) => {
    await page.getByTestId('project-card-menu').first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page).toHaveURL('/');
  });

  test('cancelling the delete dialog leaves the card intact', async ({ page }) => {
    await page.getByTestId('project-card-menu').first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('project-card')).toHaveCount(MOCK_PROJECTS.length);
    await expect(page).toHaveURL('/');
  });

  test('confirming delete removes the card and stays on the dashboard', async ({ page }) => {
    await page.getByTestId('project-card-menu').first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByTestId('project-card')).toHaveCount(MOCK_PROJECTS.length - 1);
    await expect(page).toHaveURL('/');
  });

  test('clicking the card body opens the project', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/project\//);
  });
});
