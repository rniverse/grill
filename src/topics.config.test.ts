import { describe, expect, test } from 'bun:test'
import { topicsConfig } from './topics.config'

describe('topicsConfig', () => {
  test('has one entry for angular', () => {
    expect(topicsConfig).toHaveLength(1)
    expect(topicsConfig[0].id).toBe('angular')
    expect(topicsConfig[0].name).toBe('Angular')
  })

  test('load() resolves the real topic module', async () => {
    const entry = topicsConfig[0]
    const loaded = await entry.load()

    expect(loaded.topic.id).toBe('angular')
    expect(typeof loaded.meta.version).toBe('string')
    expect(loaded.questions.length).toBeGreaterThan(0)
  })
})
