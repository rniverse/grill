import { describe, expect, test } from 'bun:test'
import { parseReferencesFile, parseTopicFile } from './content.schema'

const validTopic = {
  id: 'angular',
  meta: {
    version: '1.0.0',
    cutOffTime: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    type: 'topic',
    name: 'Angular',
  },
  questions: [
    {
      id: 'q1',
      question: 'What is a signal?',
      answer: { type: 'markdown.text', value: 'A reactive primitive.' },
      references: [],
      related: [],
    },
  ],
}

const validReferences = {
  id: 'angular',
  meta: {
    version: '1.0.0',
    cutOffTime: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    type: 'reference',
    name: 'Angular',
  },
  references: [{ id: 'r1', term: 'Signal', text: { type: 'markdown.text', value: 'A reactive primitive.' } }],
}

describe('parseTopicFile', () => {
  test('accepts a valid topic file', () => {
    const result = parseTopicFile(validTopic)
    expect(result.success).toBe(true)
  })

  test('rejects a topic file missing meta.version', () => {
    const broken = { ...validTopic, meta: { ...validTopic.meta, version: undefined } }
    const result = parseTopicFile(broken)
    expect(result.success).toBe(false)
  })

  test('rejects a topic file where a question id is a number', () => {
    const broken = { ...validTopic, questions: [{ ...validTopic.questions[0], id: 123 }] }
    const result = parseTopicFile(broken)
    expect(result.success).toBe(false)
  })

  test('rejects a topic file with an unknown RichText type', () => {
    const broken = {
      ...validTopic,
      questions: [{ ...validTopic.questions[0], answer: { type: 'not-a-type', value: 'x' } }],
    }
    const result = parseTopicFile(broken)
    expect(result.success).toBe(false)
  })

  test('rejects a non-object', () => {
    expect(parseTopicFile('not an object').success).toBe(false)
    expect(parseTopicFile(null).success).toBe(false)
  })
})

describe('parseReferencesFile', () => {
  test('accepts a valid references file', () => {
    const result = parseReferencesFile(validReferences)
    expect(result.success).toBe(true)
  })

  test('rejects a references file missing a term', () => {
    const broken = { ...validReferences, references: [{ id: 'r1', text: validReferences.references[0].text }] }
    const result = parseReferencesFile(broken)
    expect(result.success).toBe(false)
  })
})
