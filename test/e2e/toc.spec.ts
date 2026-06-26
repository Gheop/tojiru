import { test, expect } from '@playwright/test'

test('the table of contents lists entries and jumps to a page', async ({ page }) => {
  await page.goto('/')

  const items = page.locator('.toc-item')
  await expect(items).toHaveCount(2)
  await expect(items.first()).toHaveText('Alpha')

  // Clicking the second entry navigates to its page and marks it active.
  await items.nth(1).click()
  await expect.poll(() => page.url()).toContain('#page=2')
  await expect(items.nth(1)).toHaveClass(/active/)
  await expect(items.first()).not.toHaveClass(/active/)
})
