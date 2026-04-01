import type { Page } from '@playwright/test'
import type { ProjectState } from '../../src/types'

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

const MOCK_PROJECT_BASE: Omit<ProjectState, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
  sourceImage: null,
  palette: [],
  groups: [],
  paletteSize: 8,
  filters: [],
  preIndexingBlur: 3,
};

export const MOCK_PROJECTS: ProjectState[] = [
  { ...MOCK_PROJECT_BASE, id: 'proj-1', name: 'Alpha Project', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
  { ...MOCK_PROJECT_BASE, id: 'proj-2', name: 'Beta Project', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

/**
 * Seed mock projects and navigate to the dashboard.
 * Must be called before any navigation so addInitScript takes effect on first load.
 */
export async function openDashboard(page: Page, projects: ProjectState[] = MOCK_PROJECTS): Promise<void> {
  await page.addInitScript((ps) => {
    (window as Window & { __e2e_projects?: unknown }).__e2e_projects = ps;
  }, projects);
  await page.goto('/');
  await page.getByTestId('project-card').first().waitFor({ timeout: 5000 });
}
