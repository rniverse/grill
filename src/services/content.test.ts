import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { content } from './content'
import type { ContentSourceConfig } from '@/config/content-sources'

const row: ContentSourceConfig = {
  id: 'angular',
  name: 'Test Topic',
  source: { topic: 'https://example.test/topic.json', references: 'https://example.test/references.json' },
}

const validTopicFile = {
  id: 'angular',
  meta: {
    version: '1.0.0',
    cutOffTime: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    type: 'topic',
    name: 'Test Topic',
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
    name: 'Test Topic',
  },
  references: [{ id: 'r1', term: 'Signal', text: { type: 'markdown.text', value: 'A reactive primitive.' } }],
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

// A 200 response whose body isn't valid JSON — response.json() rejects with
// a SyntaxError in this case, distinct from a network failure or a schema
// mismatch on already-parsed JSON.
function malformedJsonResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async (): Promise<unknown> => {
      throw new SyntaxError('Unexpected token')
    },
  } as Response
}

// bun-types' `fetch` is a function-plus-namespace (it carries `.preconnect`),
// so a plain mock function isn't structurally assignable to it. Centralize
// the cast here rather than repeating it at every call site.
function mockFetch(impl: () => Promise<Response>) {
  const fetchMock = mock(impl)
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  localStorage.clear()
})

describe('content.load.topic', () => {
  test('success: fetches, validates, and returns the adapted data', async () => {
    mockFetch(async () => jsonResponse(validTopicFile))

    const result = await content.load.topic(row)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.data.topic.id).toBe('angular')
      expect(result.data.questions).toHaveLength(1)
    }
  })

  test('every call fetches live — two calls in a row both hit fetch', async () => {
    const fetchMock = mockFetch(async () => jsonResponse(validTopicFile))

    await content.load.topic(row)
    await content.load.topic(row)

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('network failure returns an error with the underlying message', async () => {
    mockFetch(async () => {
      throw new TypeError('network down')
    })

    const result = await content.load.topic(row)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('network down')
    }
  })

  test('a non-2xx response returns an HTTP-status error', async () => {
    mockFetch(async () => jsonResponse({}, false, 404))

    const result = await content.load.topic(row)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('HTTP 404')
    }
  })

  test('schema failure returns a schema-shaped error', async () => {
    mockFetch(async () => jsonResponse({ not: 'a topic file' }))

    const result = await content.load.topic(row)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('response did not match the expected content schema')
    }
  })

  test('a row with no topic source returns an error without calling fetch', async () => {
    const fetchMock = mockFetch(async () => jsonResponse(validTopicFile))
    const noTopicRow: ContentSourceConfig = { id: 'x', name: 'X', source: {} }

    const result = await content.load.topic(noTopicRow)

    expect(result.status).toBe('error')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('a 200 response with a malformed body resolves to an error instead of rejecting', async () => {
    mockFetch(async () => malformedJsonResponse())

    const result = await content.load.topic(row)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('Unexpected token')
    }
  })
})

describe('content.load.references', () => {
  test('success: fetches, validates, and returns the adapted data', async () => {
    mockFetch(async () => jsonResponse(validReferencesFile))

    const result = await content.load.references(row)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.data.references).toHaveLength(1)
    }
  })

  test('a row with no references source returns an error without calling fetch', async () => {
    const fetchMock = mockFetch(async () => jsonResponse(validReferencesFile))
    const noReferencesRow: ContentSourceConfig = { id: 'x', name: 'X', source: {} }

    const result = await content.load.references(noReferencesRow)

    expect(result.status).toBe('error')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('a 200 response with a malformed body resolves to an error instead of rejecting', async () => {
    mockFetch(async () => malformedJsonResponse())

    const result = await content.load.references(row)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('Unexpected token')
    }
  })
})
