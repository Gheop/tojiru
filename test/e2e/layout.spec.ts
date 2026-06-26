import { test, expect } from '@playwright/test'

test('the layout toggle switches to a horizontal paged view and persists', async ({ page }) => {
  await page.goto('/')
  const pageArea = page.locator('#page')
  await expect(pageArea).not.toHaveClass(/paged/)

  // Toggle to paged: pages now sit side by side (different left offsets, same top).
  await page.locator('#layout').click()
  await expect(pageArea).toHaveClass(/paged/)
  const boxes = await page.locator('.page').evaluateAll((els) =>
    els.map((e) => ({ left: (e as HTMLElement).offsetLeft, top: (e as HTMLElement).offsetTop })),
  )
  expect(boxes[1].left).toBeGreaterThan(boxes[0].left)
  expect(boxes[0].top).toBe(boxes[1].top)

  // The right arrow advances one page (left-to-right document).
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => page.url()).toContain('#page=2')

  // The choice is global and survives a reload.
  await page.reload()
  await expect(pageArea).toHaveClass(/paged/)

  // Toggling back returns to the continuous scroll layout.
  await page.locator('#layout').click()
  await expect(pageArea).not.toHaveClass(/paged/)
})
