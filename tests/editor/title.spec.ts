import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Project title', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
  })

  test('project title is visible by default', async ({ page }) => {
    await expect(page.getByTestId('project-title')).toBeVisible()
    await expect(page.getByTestId('project-title')).toContainText('Untitled Project')
  })

  test('clicking the title enters edit mode', async ({ page }) => {
    await page.getByTestId('project-title').click()
    // After clicking, an editable input replaces the title text
    await expect(page.locator('[data-testid="project-title"] input')).toBeVisible()
  })

  test('typing a new name and pressing Enter updates the title', async ({ page }) => {
    await page.getByTestId('project-title').click()
    const input = page.locator('[data-testid="project-title"] input')
    await input.fill('My Painting')
    await input.press('Enter')
    await expect(page.getByTestId('project-title')).toContainText('My Painting')
  })

  test('pressing Escape cancels the edit and keeps the original name', async ({ page }) => {
    await page.getByTestId('project-title').click()
    const input = page.locator('[data-testid="project-title"] input')
    await input.fill('Should Not Stick')
    await input.press('Escape')
    await expect(page.getByTestId('project-title')).toContainText('Untitled Project')
  })
})
