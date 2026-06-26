import { test, expect } from '@playwright/test'

test('the theme toggle flips dark/light and persists across reloads', async ({ page }) => {
  await page.goto('/')
  const root = page.locator('html')

  // Clicking the toggle writes a concrete theme to <html> and to localStorage.
  await page.locator('#theme').click()
  const first = await root.getAttribute('data-theme')
  expect(first === 'dark' || first === 'light').toBeTruthy()
  expect(await page.evaluate(() => localStorage.getItem('tojiru:theme'))).toBe(first)

  // The saved override survives a reload (set early by the inline head script).
  await page.reload()
  await expect(root).toHaveAttribute('data-theme', first as string)

  // Toggling again flips to the other theme.
  await page.locator('#theme').click()
  const second = await root.getAttribute('data-theme')
  expect(second).not.toBe(first)

  // Each thumbnail is a focusable button, not a bare image.
  await expect(page.locator('#menu button.thumb')).toHaveCount(2)
})
