import { describe, expect, test } from 'bun:test'
import { topicsConfig } from './topics.config'

describe('topicsConfig', () => {
  test('has one entry each for angular and nodejs', () => {
    expect(topicsConfig).toHaveLength(2)
    expect(topicsConfig[0].id).toBe('angular')
    expect(topicsConfig[0].name).toBe('Angular')
    expect(topicsConfig[1].id).toBe('nodejs')
    expect(topicsConfig[1].name).toBe('Node.js')
  })

  test('load() resolves the real topic module', async () => {
    for (const entry of topicsConfig) {
      const loaded = await entry.load.topics()

      expect(loaded.topic.id).toBe(entry.id)
      expect(typeof loaded.meta.version).toBe('string')
      expect(loaded.questions.length).toBeGreaterThan(0)
    }
  })

  test('loadReferences() resolves the real references module', async () => {
    for (const entry of topicsConfig) {
      const loaded = await entry.load.references()

      expect(Array.isArray(loaded.references)).toBe(true)
      expect(loaded.references.length).toBeGreaterThan(0)
    }
  })
})
