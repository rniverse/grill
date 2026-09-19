import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ReferencesPage } from './ReferencesPage'
import { contentCache } from '@/services/content-cache'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

function fixtureFor(url: string): unknown {
  if (url.includes('/topics/angular')) return angularTopicData
  if (url.includes('/references/angular')) return angularReferencesData
  if (url.includes('/topics/nodejs')) return nodejsTopicData
  if (url.includes('/references/nodejs')) return nodejsReferencesData
  throw new Error(`no fixture for ${url}`)
}

function mockFetch() {
  const fetchMock = mock(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
  })
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  localStorage.clear()
  contentCache.clear()
})

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/references" element={<ReferencesPage />} />
        <Route path="/references/:topicId" element={<ReferencesPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReferencesPage', () => {
  describe('topic picker (/references)', () => {
    test('renders a row for every configured topic from local storage, with no network request', () => {
      const fetchMock = () => {
        throw new Error('the references picker must not fetch — names come from local storage')
      }
      globalThis.fetch = fetchMock as unknown as typeof fetch

      renderAt('/references')

      expect(screen.getByText('Angular')).toBeDefined()
      expect(screen.getByText('Node.js')).toBeDefined()
    })

    test('clicking a topic row navigates to that topic\'s reference chips', async () => {
      mockFetch()
      renderAt('/references')

      fireEvent.click(screen.getByText('Angular'))

      expect(await screen.findByRole('button', { name: 'Signal' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'NgRx' })).toBeDefined()
    })

  })

  describe('topic references (/references/:topicId)', () => {
    test('never fetches the topic (questions) file — only references for this slug', async () => {
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/topics/')) throw new Error(`must not fetch the topic file: ${url}`)
        return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
      }) as unknown as typeof fetch

      renderAt('/references/nodejs')

      expect(await screen.findByRole('button', { name: 'Event Loop' })).toBeDefined()
    })

    test('renders every reference as a clickable chip', async () => {
      mockFetch()
      renderAt('/references/nodejs')
      expect(await screen.findByRole('button', { name: 'Event Loop' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'libuv' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Buffer' })).toBeDefined()
    })

    test('clicking a chip opens ReferenceModal with that reference', async () => {
      mockFetch()
      renderAt('/references/nodejs')
      const chip = await screen.findByRole('button', { name: 'Event Loop' })

      fireEvent.click(chip)

      expect(await screen.findByText('Event Loop', { selector: '.reference-modal__term' })).toBeDefined()
      expect(await screen.findByText(/repeatedly moves through six phases/i)).toBeDefined()
    })

    test('shows a not-found message for an unknown topic id, with a link back to /references', async () => {
      renderAt('/references/does-not-exist')
      expect(await screen.findByText('Topic not found.')).toBeDefined()
      expect(screen.getByRole('link', { name: 'Back to references' })).toBeDefined()
    })

    test('re-mounting the same topic reuses the cache — no second fetch', async () => {
      const fetchMock = mockFetch()
      const { unmount } = render(
        <MemoryRouter initialEntries={['/references/nodejs']}>
          <Routes>
            <Route path="/references/:topicId" element={<ReferencesPage />} />
          </Routes>
        </MemoryRouter>,
      )
      await screen.findByRole('button', { name: 'Event Loop' })
      unmount()

      render(
        <MemoryRouter initialEntries={['/references/nodejs']}>
          <Routes>
            <Route path="/references/:topicId" element={<ReferencesPage />} />
          </Routes>
        </MemoryRouter>,
      )
      await screen.findByRole('button', { name: 'Event Loop' })

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('clicking the reload button forces a fresh fetch even though the topic is cached', async () => {
      const fetchMock = mockFetch()
      renderAt('/references/nodejs')
      await screen.findByRole('button', { name: 'Event Loop' })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByRole('button', { name: 'Reload references' }))
      await screen.findByRole('button', { name: 'Event Loop' })

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
