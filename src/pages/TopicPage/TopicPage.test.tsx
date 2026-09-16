import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TopicPage } from './TopicPage'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

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

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topics/:topicId" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopicPage', () => {
  test('loads the topic and renders every question once', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    const questionButtons = await screen.findAllByRole('button', { name: /standalone/i })
    expect(questionButtons.length).toBeGreaterThan(0)
  })

  test('expanding a question shows its answer', async () => {
    renderAt('/topics/angular')
    const toggles = await screen.findAllByRole('button', { name: /standalone/i })
    fireEvent.click(toggles[0])
    expect(await screen.findByText(/removes a layer of indirection/i)).toBeDefined()
  })

  test('filtering by tag hides non-matching questions', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    const allButtons = await screen.findAllByRole('button')
    const initialCount = allButtons.filter((button) => button.className.includes('question-card__header')).length
    const architectureChip = screen.getByRole('button', { name: 'Fundamentals & Architecture' })
    fireEvent.click(architectureChip)
    const filteredButtons = screen.getAllByRole('button').filter((button) => button.className.includes('question-card__header'))
    expect(filteredButtons.length).toBeLessThan(initialCount)
  })

  test('a ?question= param opens that question on load', async () => {
    const target = angularQuestions[0]
    renderAt(`/topics/angular?question=${target.id}`)

    const toggle = await screen.findByRole('button', { name: target.question })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })

  test('an unknown ?question= id is ignored — nothing opens', async () => {
    renderAt('/topics/angular?question=does-not-exist')
    await screen.findAllByText('Angular')

    const toggles = await screen.findAllByRole('button', { name: /standalone/i })
    for (const toggle of toggles) {
      expect(toggle.getAttribute('aria-expanded')).toBe('false')
    }
  })

  test('shows a not-found message for an unknown topic id', async () => {
    renderAt('/topics/does-not-exist')
    expect(await screen.findByText('Topic not found.')).toBeDefined()
  })

  test('clicking a reference badge in an answer opens the modal for that reference', async () => {
    renderAt('/topics/nodejs')
    const toggle = await screen.findByRole('button', { name: /priority order between/i })
    fireEvent.click(toggle)

    const badge = await screen.findByText('event loop', { selector: '.reference-badge' })
    fireEvent.click(badge)

    // 'Event Loop' also labels the (unconditionally-mounted, CSS-hidden at
    // desktop) mobile reference chip now — disambiguate to the modal's title.
    expect(await screen.findByText('Event Loop', { selector: '.reference-modal__term' })).toBeDefined()
    expect(
      await screen.findByText(/repeatedly moves through six phases/i),
    ).toBeDefined()
  })

  test('bookmarking a question toggles its bookmark button state', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')

    const bookmarkButton = screen.getAllByRole('button', { name: 'Bookmark' })[0]
    fireEvent.click(bookmarkButton)

    expect(screen.getAllByRole('button', { name: 'Bookmarked' })[0]).toBeDefined()
  })

  test('renders a MobileNav trigger in the mobile header', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
  })

  test('the References icon shows the mobile reference chip list, and back, without unmounting the question list', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    const questionButtons = await screen.findAllByRole('button', { name: /standalone/i })
    expect(questionButtons.length).toBeGreaterThan(0)

    const referencesToggle = screen.getByRole('button', { name: 'Show references' })
    fireEvent.click(referencesToggle)

    // This is a CSS-driven visibility swap, not a JSX unmount/remount — the
    // exact same question-card DOM nodes (referential identity, not just
    // matching content) must still be present so that rotating back over
    // --bp-mobile recovers the desktop layout with no JS width tracking
    // (see TopicPage.css's --active/--hidden-mobile pair).
    const questionButtonsAfterToggle = screen.getAllByRole('button', { name: /standalone/i })
    expect(questionButtonsAfterToggle.length).toBe(questionButtons.length)
    questionButtonsAfterToggle.forEach((button, index) => {
      expect(button).toBe(questionButtons[index])
    })
    expect(screen.getByText(/References ·/)).toBeDefined()

    fireEvent.click(referencesToggle)
    const questionButtonsAfterToggleBack = screen.getAllByRole('button', { name: /standalone/i })
    questionButtonsAfterToggleBack.forEach((button, index) => {
      expect(button).toBe(questionButtons[index])
    })
  })

  test('tapping a reference chip in the mobile references view opens the reference modal', async () => {
    renderAt('/topics/nodejs')
    await screen.findAllByText('Node.js')

    fireEvent.click(screen.getByRole('button', { name: 'Show references' }))
    fireEvent.click(screen.getByText('Event Loop'))

    expect(await screen.findByText(/repeatedly moves through six phases/i)).toBeDefined()
  })

  test('the Bookmark filter icon shows only bookmarked questions, and clearing it restores the full list', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    const initialCount = (await screen.findAllByRole('button', { name: /standalone/i })).length

    fireEvent.click(screen.getAllByRole('button', { name: 'Bookmark' })[0])

    const bookmarkFilterToggle = screen.getByRole('button', { name: 'Show bookmarked questions only' })
    fireEvent.click(bookmarkFilterToggle)

    const filteredButtons = screen
      .getAllByRole('button')
      .filter((button) => button.className.includes('question-card__header'))
    expect(filteredButtons.length).toBe(1)

    fireEvent.click(bookmarkFilterToggle)
    expect((await screen.findAllByRole('button', { name: /standalone/i })).length).toBe(initialCount)
  })

  test('the "Saved" chip in the mobile filter row also toggles the bookmark filter', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')

    fireEvent.click(screen.getAllByRole('button', { name: 'Bookmark' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Saved' }))

    const filteredButtons = screen
      .getAllByRole('button')
      .filter((button) => button.className.includes('question-card__header'))
    expect(filteredButtons.length).toBe(1)
  })

  test('turning on the bookmark filter clears the active state on every tag chip', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')

    // A tag chip is active (the default "All" filter) before the bookmark
    // filter is turned on.
    expect(document.querySelectorAll('.filter-chips__chip[aria-pressed="true"]').length).toBe(1)

    const bookmarkFilterToggle = screen.getByRole('button', { name: 'Show bookmarked questions only' })
    fireEvent.click(bookmarkFilterToggle)

    expect(document.querySelectorAll('.filter-chips__chip[aria-pressed="true"]').length).toBe(0)
  })
})
