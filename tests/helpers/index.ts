import type { Page } from '@playwright/test'

/**
 * Navigate to the editor and wait for it to mount.
 * In E2E test mode, auth is bypassed and the project loads with empty state.
 */
export async function openEditor(page: Page, projectId: string = 'test'): Promise<void> {
  await page.goto(`/project/${projectId}`)
  // The title is always visible as soon as the editor mounts in test mode
  await page.getByText('Untitled Project').waitFor({ timeout: 10000 })
}

/**
 * Upload a test image from the upload prompt.
 * Generates a PNG from the browser's canvas so createImageBitmap can always decode it.
 * Call this after openEditor when the upload prompt is visible.
 */
export async function uploadTestImage(page: Page): Promise<void> {
  // Generate a 10×10 red PNG using the browser's own canvas — guaranteed decodable
  const pngBytes = await page.evaluate(() => new Promise<number[]>(resolve => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 10, height: 10 })
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(0, 0, 10, 10)
    canvas.toBlob(async blob => {
      const buf = await blob!.arrayBuffer()
      resolve(Array.from(new Uint8Array(buf)))
    }, 'image/png')
  }))

  // Two file inputs exist (ImageUploader + ReplaceImageModal); target the first (upload prompt)
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBytes),
  })
  // Wait for the tab bar to appear — the editor switches away from the upload prompt
  await page.getByRole('tablist').waitFor({ state: 'visible', timeout: 10000 })
}

/**
 * Open the editor and upload a test image in one step.
 * Leaves the editor on the Filters tab (the default active tab).
 */
export async function openEditorWithImage(page: Page): Promise<void> {
  await openEditor(page)
  await uploadTestImage(page)
}

/**
 * Click the palette tool with the given id (e.g. 'select', 'marquee', 'eyedropper').
 * The Palette tab must be active for the tool rail to be visible.
 */
export async function activateTool(page: Page, toolId: string): Promise<void> {
  await page.getByTestId(`tool-${toolId}`).click()
}
