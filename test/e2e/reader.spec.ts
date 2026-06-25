import { test, expect } from '@playwright/test'

test('le lecteur rend la première page SVG et navigue au clavier', async ({ page }) => {
  await page.goto('/')
  // la première page se charge et injecte un <svg> inline
  const firstSvg = page.locator('.page svg').first()
  await expect(firstSvg).toBeVisible()
  await expect(firstSvg.locator('text')).toHaveText('Page 1')

  // la barre de miniatures liste 2 pages
  await expect(page.locator('#menu img')).toHaveCount(2)

  // flèche bas met à jour le deep-link
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => page.url()).toContain('#page=2')
})
