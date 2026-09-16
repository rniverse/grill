import { describe, expect, test } from 'bun:test'
import { parseReferencesFile, parseTopicFile } from './content.schema'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

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

// Before this feature these files were `import()`ed and type-checked at
// build time. Now they're only fetched and validated at runtime in the
// browser — nothing else in the suite confirms the actual shipped files
// still pass the schema a future edit to them could silently break.
describe('real shipped content files', () => {
  test.each([
    ['topics/angular.json', angularTopicData],
    ['topics/nodejs.json', nodejsTopicData],
  ])('%s passes parseTopicFile', (_name, data) => {
    const result = parseTopicFile(data)
    expect(result.success).toBe(true)
  })

  test.each([
    ['references/angular.json', angularReferencesData],
    ['references/nodejs.json', nodejsReferencesData],
  ])('%s passes parseReferencesFile', (_name, data) => {
    const result = parseReferencesFile(data)
    expect(result.success).toBe(true)
  })
})
