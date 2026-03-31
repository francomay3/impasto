import { test, expect } from '@playwright/test'
import { openEditorWithImage, activateTool } from '../helpers'

test.describe('Canvas viewport panning', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('canvas-viewport-filtered').waitFor()
  })

  test('filtered viewport enters dragging state on mousedown (select tool)', async ({ page }) => {
    // select tool is active by default on the Palette tab
    const viewport = page.getByTestId('canvas-viewport-filtered')
    const box = await viewport.boundingBox()
    if (!box) throw new Error('canvas-viewport-filtered not found')

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()

    // isDragging → cursor switches to 'grabbing'
    await expect(viewport).toHaveCSS('cursor', 'grabbing')

    await page.mouse.up()
  })

  test('filtered viewport pan moves the canvas transform', async ({ page }) => {
    const viewport = page.getByTestId('canvas-viewport-filtered')
    const box = await viewport.boundingBox()
    if (!box) throw new Error('canvas-viewport-filtered not found')

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 50, cy + 30)
    await page.mouse.up()

    // After a drag, the transform box should have a non-zero translate.
    // The transform is committed back to React state on mouseup.
    const transformBox = viewport.locator('> div').first()
    const transform = await transformBox.evaluate((el) => el.style.transform)
    expect(transform).not.toBe('translate(0px, 0px) scale(1)')
  })

  test('marquee tool does not pan when drawing a selection', async ({ page }) => {
    await activateTool(page, 'marquee')

    const viewport = page.getByTestId('canvas-viewport-filtered')
    const box = await viewport.boundingBox()
    if (!box) throw new Error('canvas-viewport-filtered not found')

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 40, cy + 40)
    await page.mouse.up()

    // Pan must not have started — cursor should still be crosshair, not grabbing
    await expect(viewport).toHaveCSS('cursor', 'crosshair')

    // Transform should remain at default
    const transformBox = viewport.locator('> div').first()
    const transform = await transformBox.evaluate((el) => el.style.transform)
    // The initial imperative style may be empty string until first listener fires; also accept the reset value
    expect(['', 'translate(0px, 0px) scale(1)']).toContain(transform)
  })
})
