import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MobileNav } from './MobileNav'
import { storage } from '@/services/storage'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions

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

// activeTopicId now comes from the route's own :topicId param (see
// MobileNav's useParams), so tests that need it render through a route
// rather than passing a prop.
function renderNav(initialPath = '/') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/topics/:topicId" Component={MobileNav} />
        <Route path="*" Component={MobileNav} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MobileNav', () => {
  test('renders a hamburger trigger and no drawer by default', () => {
    renderNav()

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('opening the drawer lists every configured topic with its question count', async () => {
    renderNav()

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(await screen.findByText('Angular')).toBeDefined()
    expect(await screen.findByText('Node.js')).toBeDefined()
    expect(await screen.findByText(String(angularQuestions.length))).toBeDefined()
  })

  test('marks the active topic from the route params', async () => {
    renderNav('/topics/angular')

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const angularLink = await screen.findByText('Angular')
    expect(angularLink.closest('a')?.getAttribute('aria-current')).toBe('true')
  })

  test('the "Yours" rows link to their own pages', async () => {
    renderNav()

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect((await screen.findByText('References')).closest('a')?.getAttribute('href')).toBe('/references')
    expect(screen.getByText('Bookmarks').closest('a')?.getAttribute('href')).toBe('/bookmarks')
    expect(screen.getByText('My questions').closest('a')?.getAttribute('href')).toBe('/questions')
    expect(screen.getByText('My notes').closest('a')?.getAttribute('href')).toBe('/notes')
  })

  test('shows a live count of pending questions in the Yours section', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestions[0].id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'A question',
    })

    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(await screen.findByText('My questions')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
  })

  test('closing the drawer via the close button hides it again', async () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    await screen.findByText('Topics')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('pressing Escape closes the drawer and returns focus to the hamburger trigger', async () => {
    renderNav()
    const trigger = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(trigger)
    await screen.findByText('Topics')

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Topics')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  test('closing the drawer via the close button also returns focus to the hamburger trigger', async () => {
    renderNav()
    const trigger = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(trigger)
    await screen.findByText('Topics')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(document.activeElement).toBe(trigger)
  })

  test('clicking a topic closes the drawer', async () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    fireEvent.click(await screen.findByText('Angular'))

    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('clicking a "Yours" row closes the drawer', async () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    fireEvent.click(await screen.findByText('Bookmarks'))

    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('clicking export downloads the current personal layer as a JSON blob', async () => {
    const createdUrls: string[] = []
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    let capturedBlob: Blob | null = null

    URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      const url = 'blob:mock-url'
      createdUrls.push(url)
      return url
    }
    URL.revokeObjectURL = () => {}

    try {
      renderNav()
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      fireEvent.click(await screen.findByText('Export personal layer'))

      expect(createdUrls).toHaveLength(1)
      expect(capturedBlob).not.toBeNull()
      expect((capturedBlob as unknown as Blob).type).toBe('application/json')
    } finally {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    }
  })
})
