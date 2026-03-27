import { test, expect } from '@playwright/test'
import { openEditor, uploadTestImage } from '../helpers'

test.describe('Image upload', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page)
  })

  test('shows the upload prompt when no image is loaded', async ({ page }) => {
    await expect(page.getByText('Start by loading an image')).toBeVisible()
    await expect(page.getByText('Drop a photo here or click to browse')).toBeVisible()
  })

  test('file input for the upload prompt is present', async ({ page }) => {
    // The ImageUploader renders a hidden file input inside the upload box
    await expect(page.locator('input[type="file"]').first()).toBeAttached()
  })

  test('tab bar appears after uploading an image', async ({ page }) => {
    await uploadTestImage(page)
    await expect(page.getByRole('tablist')).toBeVisible()
  })

  test('upload prompt disappears after uploading an image', async ({ page }) => {
    await uploadTestImage(page)
    await expect(page.getByText('Start by loading an image')).not.toBeVisible()
  })

  test('Filters tab is active by default after upload', async ({ page }) => {
    await uploadTestImage(page)
    await expect(page.getByRole('tab', { name: /Filters/ })).toHaveAttribute('aria-selected', 'true')
  })
})
