import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MobileNav } from './MobileNav'
import { storage } from '@/services/storage'
import angularTopicData from '@/topics/angular.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions

beforeEach(() => {
  localStorage.clear()
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

  test('opening the drawer lists every configured topic from local storage, with no network request', () => {
    const fetchMock = () => {
      throw new Error('MobileNav must not fetch — topic names come from local storage')
    }
    globalThis.fetch = fetchMock as unknown as typeof fetch

    renderNav()

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(screen.getByText('Angular')).toBeDefined()
    expect(screen.getByText('Node.js')).toBeDefined()
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

})
