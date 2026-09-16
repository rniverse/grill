import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ReferencesPage } from './ReferencesPage'
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

beforeEach(() => {
  localStorage.clear()
  globalThis.fetch = mock(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
  }) as unknown as typeof fetch
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
    test('renders a row for every configured topic once loaded', async () => {
      renderAt('/references')
      expect(await screen.findByText('Angular')).toBeDefined()
      expect(screen.getByText('Node.js')).toBeDefined()
    })

    test('renders each topic with its real reference count, not a question count', async () => {
      renderAt('/references')
      await screen.findByText('Angular')

      // angular ships 5 references, nodejs ships 3 (src/references/*.ts) —
      // distinct from either topic's question count, so this proves the
      // picker is counting references and not reusing LandingPage's numbers.
      const angularRow = screen.getByText('Angular').closest('a')
      const nodejsRow = screen.getByText('Node.js').closest('a')
      expect(angularRow?.textContent).toContain('5')
      expect(nodejsRow?.textContent).toContain('3')
    })

    test('clicking a topic row navigates to that topic\'s reference chips', async () => {
      renderAt('/references')
      await screen.findByText('Angular')

      fireEvent.click(screen.getByText('Angular'))

      expect(await screen.findByRole('button', { name: 'Signal' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'NgRx' })).toBeDefined()
    })

    test('renders a MobileNav trigger for phone widths', async () => {
      renderAt('/references')
      await screen.findByText('Angular')

      expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
    })
  })

  describe('topic references (/references/:topicId)', () => {
    test('renders every reference as a clickable chip', async () => {
      renderAt('/references/nodejs')
      expect(await screen.findByRole('button', { name: 'Event Loop' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'libuv' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Buffer' })).toBeDefined()
    })

    test('clicking a chip opens ReferenceModal with that reference', async () => {
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

    test('renders a MobileNav trigger for phone widths, including on the not-found screen', async () => {
      renderAt('/references/nodejs')
      await screen.findByRole('button', { name: 'Event Loop' })
      expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()

      renderAt('/references/does-not-exist')
      expect(await screen.findByText('Topic not found.')).toBeDefined()
      expect(screen.getAllByRole('button', { name: 'Menu' }).length).toBeGreaterThan(0)
    })
  })
})
