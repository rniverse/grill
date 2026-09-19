import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, act, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BookmarksPage } from './BookmarksPage'
import { storage } from '@/services/storage'
import { contentCache } from '@/services/content-cache'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions
const angularReferences = angularReferencesData.references
const nodejsTopic = { name: nodejsTopicData.meta.name }
const nodejsReferences = nodejsReferencesData.references

const angularQuestion = angularQuestions[0]
const angularReference = angularReferences[0]
const nodejsReference = nodejsReferences[0]

function fixtureFor(url: string): unknown {
  if (url.includes('/topics/angular')) return angularTopicData
  if (url.includes('/references/angular')) return angularReferencesData
  if (url.includes('/topics/nodejs')) return nodejsTopicData
  if (url.includes('/references/nodejs')) return nodejsReferencesData
  throw new Error(`no fixture for ${url}`)
}

let fetchMock: ReturnType<typeof mock>

beforeEach(() => {
  localStorage.clear()
  contentCache.clear()
  fetchMock = mock(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
  })
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

function renderPage() {
  return render(
    <MemoryRouter>
      <BookmarksPage />
    </MemoryRouter>,
  )
}

describe('BookmarksPage', () => {
  test('renders the page heading', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('heading', { name: 'Bookmarks' })).toBeDefined()
  })

  test('renders a Questions section and a References section', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Questions' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'References' })).toBeDefined()
  })

  test('shows the empty state in both sections with no bookmarks', async () => {
    renderPage()

    expect(await screen.findAllByText('Nothing bookmarked yet.')).toHaveLength(2)
  })

  test('resolves a bookmarked question to its text under the Questions section, across topics', async () => {
    storage.toggle.bookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    const toggle = await screen.findByRole('button', { name: 'Questions' })
    const questionsSection = toggle.closest('section')
    if (!questionsSection) throw new Error('expected a section ancestor')
    expect(within(questionsSection).getByText(angularQuestion.question)).toBeDefined()
    expect(within(questionsSection).getByText('Angular')).toBeDefined()
  })

  test('resolves a bookmarked reference under the References section', async () => {
    storage.toggle.bookmark({ kind: 'reference', id: angularReference.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    const toggle = await screen.findByRole('button', { name: 'References' })
    const referencesSection = toggle.closest('section')
    if (!referencesSection) throw new Error('expected a section ancestor')
    expect(within(referencesSection).getByText(angularReference.term)).toBeDefined()
  })

  test('a question bookmark links to the topic page, opened to that question', async () => {
    storage.toggle.bookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    const link = await screen.findByRole('link', { name: new RegExp(angularQuestion.question) })
    expect(link.getAttribute('href')).toBe(`/topics/angular?question=${angularQuestion.id}`)
  })

  test('a reference bookmark opens the reference in place instead of navigating', async () => {
    storage.toggle.bookmark({ kind: 'reference', id: angularReference.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    const item = await screen.findByText(angularReference.term)
    expect(item.closest('a')).toBeNull()

    fireEvent.click(item)

    expect(await screen.findByRole('button', { name: 'Close' })).toBeDefined()
  })

  test('the topic chip sits after the item label, not before it', async () => {
    storage.toggle.bookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    const label = await screen.findByText(angularQuestion.question)
    const row = label.closest('.bookmarks-page__item')
    if (!row) throw new Error('expected a row ancestor')
    const children = Array.from(row.children)
    const labelIndex = children.indexOf(label)
    const chipIndex = children.findIndex((child) => child.className.includes('topic-chip'))
    expect(chipIndex).toBeGreaterThan(labelIndex)
  })

  test('one question bookmark on angular + one reference bookmark on nodejs: only fetches angular topic + nodejs references, nothing else', async () => {
    storage.toggle.bookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })
    storage.toggle.bookmark({ kind: 'reference', id: nodejsReference.id }, { name: nodejsTopic.name, version: '1.0.0' })

    renderPage()
    await screen.findByText(angularQuestion.question)
    await screen.findByText(nodejsReference.term)

    const fetchedUrls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(fetchedUrls.some((url) => url.includes('/topics/angular'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/references/nodejs'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/references/angular'))).toBe(false)
    expect(fetchedUrls.some((url) => url.includes('/topics/nodejs'))).toBe(false)
    expect(fetchedUrls).toHaveLength(2)
  })

  test('re-mounting the page reuses the cache — no second round of fetches', async () => {
    storage.toggle.bookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })

    const { unmount } = renderPage()
    await screen.findByText(angularQuestion.question)
    const callsAfterFirstMount = fetchMock.mock.calls.length
    unmount()

    renderPage()
    await screen.findByText(angularQuestion.question)

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirstMount)
  })
})
