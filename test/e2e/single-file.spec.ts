import { test, expect } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Opened by double-click, a single file runs from a file:// (opaque null) origin.
// blob: URLs become blob:null/… which <object> refuses to load, so the reader must
// use data: URLs for vector pages there. This test reproduces that exact context.
test('the single file renders vector pages from a file:// origin', async ({ page }) => {
  const url = pathToFileURL(resolve('test-output/single.html')).href
  await page.goto(url)

  const firstObject = page.locator('.page object').first()
  await expect(firstObject).toBeVisible()

  // Thumbnails come from inline data, not the network.
  await expect(page.locator('#menu img')).toHaveCount(2)

  // Load the second page too so both objects exist.
  await page.locator('.page').nth(1).scrollIntoViewIfNeeded()
  await expect(page.locator('.page object').nth(1)).toBeVisible()

  // Vector pages must use data: URLs here (blob:null/… would silently fail to load).
  // Each page is its own data: document, so glyphs stay isolated (the distinct URLs).
  // contentDocument is unreadable across the file:// opaque origin, so we assert the
  // observable contract: both render, both are data:, and they differ.
  const datas = await page.evaluate(() => {
    const objects = Array.from(document.querySelectorAll('.page object')) as HTMLObjectElement[]
    return objects.map((o) => o.data)
  })
  expect(datas[0]).toMatch(/^data:image\/svg\+xml/)
  expect(datas[1]).toMatch(/^data:image\/svg\+xml/)
  expect(datas[0]).not.toBe(datas[1])
})
