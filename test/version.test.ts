// test/version.test.ts
import { test, expect } from 'vitest'
import { VERSION } from '../src/version.js'

test('VERSION is a non-empty semver string', () => {
  expect(typeof VERSION).toBe('string')
  expect(VERSION).toMatch(/^\d+\.\d+\.\d+/)
})
