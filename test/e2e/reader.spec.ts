import { test, expect } from '@playwright/test'

test('the reader renders pages via <object> and isolates glyphs per page', async ({ page }) => {
  await page.goto('/')

  // The first page loads as an isolated SVG <object>.
  const firstObject = page.locator('.page object').first()
  await expect(firstObject).toBeVisible()

  // The thumbnail bar lists 2 pages.
  await expect(page.locator('#menu img')).toHaveCount(2)

  // The second page may need to load before asserting.
  const secondPageDiv = page.locator('.page').nth(1)
  await secondPageDiv.scrollIntoViewIfNeeded()
  const secondObject = page.locator('.page object').nth(1)
  await expect(secondObject).toBeVisible()

  // contentFrame() in Playwright 1.61 only works with <iframe>,
  // not <object>. We use page.evaluate() to access the contentDocument
  // of <object> elements (possible because blob: URLs share the page origin).
  // This verifies glyph non-regression: each page renders its own #ink.
  // Poll: an <object>'s contentDocument is populated asynchronously after it becomes
  // visible, so reading it once races on slower machines (it was flaky in CI).
  await expect.poll(async () => page.evaluate(() => {
    const objects = Array.from(document.querySelectorAll('.page object')) as HTMLObjectElement[]
    return objects.map((obj) => obj.contentDocument?.querySelector('text')?.textContent?.trim() ?? null)
  })).toEqual(['Page 1', 'Page 2'])

  // The two <object> elements have distinct blob: URLs (two separate documents).
  const dataAttrs = await page.evaluate(() => {
    const objects = Array.from(document.querySelectorAll('.page object')) as HTMLObjectElement[]
    return objects.map((obj) => obj.data)
  })
  expect(dataAttrs[0]).toMatch(/^blob:/)
  expect(dataAttrs[1]).toMatch(/^blob:/)
  expect(dataAttrs[0]).not.toBe(dataAttrs[1])

  // Keyboard navigation: arrow down updates the deep-link.
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => page.url()).toContain('#page=2')
})
