import { test, expect } from '@playwright/test'

test('Ctrl+F searches the text index and jumps to the matching page', async ({ page }) => {
  await page.goto('/')

  // The panel is hidden until opened.
  await expect(page.locator('#search')).toHaveClass(/hidden/)

  // Ctrl+F opens it (the build shipped a search index) instead of the native find.
  await page.keyboard.press('Control+f')
  await expect(page.locator('#search')).not.toHaveClass(/hidden/)
  await expect(page.locator('#search-input')).toBeFocused()

  // Typing a word unique to page 2 yields exactly one hit pointing at page 2.
  await page.locator('#search-input').fill('beta')
  const hits = page.locator('#search-results .hit')
  await expect(hits).toHaveCount(1)
  await expect(hits.first()).toContainText('p.2')
  await expect(hits.first().locator('mark')).toHaveText('Beta')

  // Activating the hit navigates and closes the panel.
  await hits.first().click()
  await expect(page.locator('#search')).toHaveClass(/hidden/)
  await expect.poll(() => page.url()).toContain('#page=2')

  // A query with no match reports it.
  await page.keyboard.press('/')
  await page.locator('#search-input').fill('zzzznotthere')
  await expect(page.locator('#search-results .empty')).toHaveText('No matches')
})
