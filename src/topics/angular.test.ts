import { describe, expect, test } from 'bun:test'
import { meta, questions, topic } from './angular'
import { references } from '@/references/angular'

describe('angular topic content', () => {
  test('topic id is angular', () => {
    expect(topic.id).toBe('angular')
  })

  test('meta has valid ISO timestamps', () => {
    expect(Number.isNaN(Date.parse(meta.cutOffTime))).toBe(false)
    expect(Number.isNaN(Date.parse(meta.updatedAt))).toBe(false)
  })

  test('every question id is unique', () => {
    const seenIds = new Set<string>()
    for (const question of questions) {
      expect(seenIds.has(question.id)).toBe(false)
      seenIds.add(question.id)
    }
  })

  test('every reference id is a real 26-character ULID', () => {
    for (const reference of references) {
      expect(reference.id).toHaveLength(26)
    }
  })

  test('every Answer.references id resolves to a real reference', () => {
    const referenceIds = new Set(references.map((r) => r.id))
    for (const question of questions) {
      for (const referenceId of question.answer.references) {
        expect(referenceIds.has(referenceId)).toBe(true)
      }
    }
  })

  test('has at least the three worked-example questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(3)
  })
})
