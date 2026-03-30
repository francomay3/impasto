import { test, expect } from '@playwright/test'
import { openEditorWithImage } from '../helpers'

test.describe('Sampler overlay — Alt+wheel changes radius', () => {
  test.beforeEach(async ({ page }) => {
    await openEditorWithImage(page)
    await page.getByRole('tab', { name: /Palette/ }).click()
    await page.getByTestId('palette-sidebar').waitFor()
  })

  async function openSamplerAndGetRadius(page: import('@playwright/test').Page) {
    await page.keyboard.press('e')
    await page.getByTestId('sampler-overlay').waitFor({ timeout: 5000 })
    const input = page.getByTestId('contextual-toolbar').locator('[data-testid="sampling-radius-input"] input')
    return input
  }

  test('Alt+wheel scrolling down decreases the sampling radius', async ({ page }) => {
    const input = await openSamplerAndGetRadius(page)
    const before = Number(await input.inputValue())

    // Dispatch a wheel event with altKey on window — the handler is registered on window
    await page.evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { altKey: true, deltaY: 30, bubbles: true, cancelable: true }))
    })

    const after = Number(await input.inputValue())
    expect(after).toBeLessThan(before)
  })

  test('Alt+wheel scrolling up increases the sampling radius', async ({ page }) => {
    const input = await openSamplerAndGetRadius(page)
    const before = Number(await input.inputValue())

    await page.evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { altKey: true, deltaY: -30, bubbles: true, cancelable: true }))
    })

    const after = Number(await input.inputValue())
    expect(after).toBeGreaterThan(before)
  })

  test('wheel without Alt does not change the sampling radius', async ({ page }) => {
    const input = await openSamplerAndGetRadius(page)
    const before = await input.inputValue()

    await page.evaluate(() => {
      window.dispatchEvent(new WheelEvent('wheel', { altKey: false, deltaY: 30, bubbles: true, cancelable: true }))
    })

    // Value should be unchanged
    await expect(input).toHaveValue(before)
  })

  test('radius is clamped to minimum of 1', async ({ page }) => {
    const input = await openSamplerAndGetRadius(page)
    // Set radius close to 1 via the input first
    await input.fill('2')
    await input.press('Tab')

    // Large downward scroll should clamp at 1
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { altKey: true, deltaY: 100, bubbles: true, cancelable: true }))
      })
    }

    const after = Number(await input.inputValue())
    expect(after).toBeGreaterThanOrEqual(1)
  })

  test('radius is clamped to maximum of 200', async ({ page }) => {
    const input = await openSamplerAndGetRadius(page)
    await input.fill('198')
    await input.press('Tab')

    // Large upward scroll should clamp at 200
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { altKey: true, deltaY: -100, bubbles: true, cancelable: true }))
      })
    }

    const after = Number(await input.inputValue())
    expect(after).toBeLessThanOrEqual(200)
  })
})
