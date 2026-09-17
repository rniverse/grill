import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { contentCache } from './content-cache'
import type { ContentSourceConfig } from '@/config/content-sources'

const row: ContentSourceConfig = {
  id: 'angular',
  name: 'Angular',
  source: { topic: 'https://example.test/topic.json', references: 'https://example.test/references.json' },
}

const validTopicFile = {
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

const validReferencesFile = {
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

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response
}

beforeEach(() => {
  contentCache.clear()
})

describe('contentCache.resolve.topic', () => {
  test('fetches on first call and returns the data', async () => {
    globalThis.fetch = mock(async () => jsonResponse(validTopicFile)) as unknown as typeof fetch

    const result = await contentCache.resolve.topic(row)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.data.topic.id).toBe('angular')
    }
  })

  test('a second call for the same source reuses the cached result — no second fetch', async () => {
    const fetchMock = mock(async () => jsonResponse(validTopicFile))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await contentCache.resolve.topic(row)
    await contentCache.resolve.topic(row)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('two concurrent calls for the same source dedupe to a single fetch', async () => {
    const fetchMock = mock(async () => jsonResponse(validTopicFile))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await Promise.all([contentCache.resolve.topic(row), contentCache.resolve.topic(row)])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('force: true bypasses the cache and fetches again', async () => {
    const fetchMock = mock(async () => jsonResponse(validTopicFile))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await contentCache.resolve.topic(row)
    await contentCache.resolve.topic(row, { force: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('a different source id caches independently', async () => {
    const fetchMock = mock(async () => jsonResponse(validTopicFile))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const otherRow: ContentSourceConfig = { id: 'nodejs', name: 'Node.js', source: { topic: 'https://example.test/nodejs.json' } }

    await contentCache.resolve.topic(row)
    await contentCache.resolve.topic(otherRow)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('contentCache.resolve.references', () => {
  test('fetches on first call and returns the data', async () => {
    globalThis.fetch = mock(async () => jsonResponse(validReferencesFile)) as unknown as typeof fetch

    const result = await contentCache.resolve.references(row)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.data.references).toHaveLength(1)
    }
  })

  test('a second call for the same source reuses the cached result — no second fetch', async () => {
    const fetchMock = mock(async () => jsonResponse(validReferencesFile))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await contentCache.resolve.references(row)
    await contentCache.resolve.references(row)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('topic and references cache independently for the same source', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      return jsonResponse(url.includes('topic.json') ? validTopicFile : validReferencesFile)
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await contentCache.resolve.topic(row)
    await contentCache.resolve.references(row)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
