import { test, expect } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// A spread + rtl single-file bundle: pages lay out two-up and the reading order is
// right-to-left. Opened via file:// so it's isolated from the single-mode bundle.
test('spread + rtl lays pages two-up with right-to-left order', async ({ page }) => {
  const url = pathToFileURL(resolve('test-output/single-spread.html')).href
  await page.goto(url)

  const pageArea = page.locator('#page')
  await expect(pageArea).toHaveClass(/spread/)
  await expect(pageArea).toHaveClass(/rtl/)

  // The container reads right-to-left, and the two pages share one row (same top).
  expect(await pageArea.evaluate((el) => getComputedStyle(el).direction)).toBe('rtl')
  const tops = await page.locator('.page').evaluateAll((els) => els.map((e) => (e as HTMLElement).offsetTop))
  expect(tops[0]).toBe(tops[1])

  // rtl flips horizontal keys: ArrowLeft advances to page 2.
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => page.url()).toContain('#page=2')
})
