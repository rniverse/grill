import { describe, expect, test } from 'bun:test'
import topicData from './angular.json'
import referencesData from '@/references/angular.json'

describe('angular topic content', () => {
  test('content bundle ids are as expected', () => {
    expect(topicData.id).toBe('angular')
    expect(referencesData.id).toBe('angular')
  })

  test('meta has valid ISO timestamps', () => {
    expect(Number.isNaN(Date.parse(topicData.meta.cutOffTime))).toBe(false)
    expect(Number.isNaN(Date.parse(topicData.meta.updatedAt))).toBe(false)
  })

  test('every question id is unique', () => {
    const seenIds = new Set<string>()
    for (const question of topicData.questions) {
      expect(seenIds.has(question.id)).toBe(false)
      seenIds.add(question.id)
    }
  })

  test('every reference id is a real 26-character ULID', () => {
    for (const reference of referencesData.references) {
      expect(reference.id).toHaveLength(26)
    }
  })

  test('every Question.references id resolves to a real reference', () => {
    const referenceIds = new Set(referencesData.references.map((r) => r.id))
    for (const question of topicData.questions) {
      for (const referenceId of question.references) {
        expect(referenceIds.has(referenceId)).toBe(true)
      }
    }
  })

  test('has at least the three worked-example questions', () => {
    expect(topicData.questions.length).toBeGreaterThanOrEqual(3)
  })
})
