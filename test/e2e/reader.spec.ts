import { test, expect } from '@playwright/test'

test('le lecteur rend les pages via <object> et isole les glyphes par page', async ({ page }) => {
  await page.goto('/')

  // La première page se charge en tant qu'<object> SVG isolé.
  const firstObject = page.locator('.page object').first()
  await expect(firstObject).toBeVisible()

  // La barre de miniatures liste 2 pages.
  await expect(page.locator('#menu img')).toHaveCount(2)

  // La deuxième page peut avoir besoin d'être chargée avant assertion.
  const secondPageDiv = page.locator('.page').nth(1)
  await secondPageDiv.scrollIntoViewIfNeeded()
  const secondObject = page.locator('.page object').nth(1)
  await expect(secondObject).toBeVisible()

  // contentFrame() de Playwright 1.61 ne fonctionne qu'avec les <iframe>,
  // pas les <object>. On passe par page.evaluate() pour accéder au contentDocument
  // des <object> (possible car les blob: URL partagent l'origine de la page).
  // On vérifie ainsi la non-régression glyphes : chaque page rend son propre #ink.
  const texts = await page.evaluate(() => {
    const objects = Array.from(document.querySelectorAll('.page object')) as HTMLObjectElement[]
    return objects.map((obj) => {
      const doc = obj.contentDocument
      if (!doc) return null
      // SVG <text> element
      return doc.querySelector('text')?.textContent?.trim() ?? null
    })
  })
  expect(texts[0]).toBe('Page 1')
  expect(texts[1]).toBe('Page 2')

  // Les deux <object> ont des URL blob: distinctes (deux documents séparés).
  const dataAttrs = await page.evaluate(() => {
    const objects = Array.from(document.querySelectorAll('.page object')) as HTMLObjectElement[]
    return objects.map((obj) => obj.data)
  })
  expect(dataAttrs[0]).toMatch(/^blob:/)
  expect(dataAttrs[1]).toMatch(/^blob:/)
  expect(dataAttrs[0]).not.toBe(dataAttrs[1])

  // Navigation clavier : flèche bas met à jour le deep-link.
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => page.url()).toContain('#page=2')
})
