import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TopicPage } from './TopicPage'
import { contentCache } from '@/services/content-cache'
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

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topics/:topicId" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Base UI's combobox opens its popup off pointer interaction, not a bare
// click event — a real browser click carries focus + pointerdown + mousedown
// with it, but fireEvent.click alone doesn't, so the popup never opens.
function openTagFilter() {
  const input = screen.getByRole('combobox')
  fireEvent.focus(input)
  fireEvent.pointerDown(input)
  fireEvent.mouseDown(input)
  fireEvent.click(input)
  return input
}

// While the popup is open, Base UI marks the rest of the page inert/
// aria-hidden (real screen-reader-correct behavior) — RTL's role queries
// correctly can't see anything behind it until it closes, same as a real
// user pressing Escape to dismiss the dropdown and look at the results.
function closeTagFilter() {
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
}

// The open popup's exit animation never completes under happy-dom, so its
// option list stays mounted (duplicating chip text) well after Escape —
// scoping to the chips box itself sidesteps that instead of waiting on it.
function selectedTagChips() {
  const chips = document.querySelector('.topic-tag-filter__chips')
  if (!chips) throw new Error('expected the tag filter chips container to exist')
  return within(chips as HTMLElement)
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

    openTagFilter()
    fireEvent.click(await screen.findByRole('option', { name: 'Fundamentals & Architecture' }))
    closeTagFilter()

    const filteredButtons = await screen.findAllByRole('button')
    const filteredCount = filteredButtons.filter((button) => button.className.includes('question-card__header')).length
    expect(filteredCount).toBeGreaterThan(0)
    expect(filteredCount).toBeLessThan(initialCount)
  })

  test('the filter placeholder reads "Showing all questions" until a tag is picked, then switches to "Select"', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')

    expect(screen.getByPlaceholderText('Showing all questions')).toBeDefined()

    openTagFilter()
    fireEvent.click(await screen.findByRole('option', { name: 'Fundamentals & Architecture' }))

    expect(selectedTagChips().getByText('Fundamentals & Architecture')).toBeDefined()
    expect(screen.getByPlaceholderText('Select')).toBeDefined()
    expect(screen.queryByPlaceholderText('Showing all questions')).toBeNull()
  })

  test('picking more than one tag shows questions matching any of them', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')

    openTagFilter()
    fireEvent.click(await screen.findByRole('option', { name: 'Fundamentals & Architecture' }))
    closeTagFilter()
    const oneTagCount = (await screen.findAllByRole('button'))
      .filter((button) => button.className.includes('question-card__header')).length

    openTagFilter()
    fireEvent.click(await screen.findByRole('option', { name: 'RxJS in Angular' }))
    closeTagFilter()
    const twoTagCount = (await screen.findAllByRole('button'))
      .filter((button) => button.className.includes('question-card__header')).length

    expect(twoTagCount).toBeGreaterThan(oneTagCount)
  })

  test('the clear button resets the tag filter back to every question', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    const initialCount = (await screen.findAllByRole('button', { name: /standalone/i })).length

    openTagFilter()
    fireEvent.click(await screen.findByRole('option', { name: 'Fundamentals & Architecture' }))
    closeTagFilter()
    expect((await screen.findAllByRole('button', { name: /standalone/i })).length).toBeLessThan(initialCount)

    fireEvent.click(screen.getByRole('button', { name: 'Clear tag filter' }))

    expect((await screen.findAllByRole('button', { name: /standalone/i })).length).toBe(initialCount)
    expect(screen.getByPlaceholderText('Showing all questions')).toBeDefined()
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

  test('turning on the bookmark filter clears the visible tag chips', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')

    openTagFilter()
    fireEvent.click(await screen.findByRole('option', { name: 'Fundamentals & Architecture' }))
    closeTagFilter()
    expect(selectedTagChips().getByText('Fundamentals & Architecture')).toBeDefined()

    const bookmarkFilterToggle = screen.getByRole('button', { name: 'Show bookmarked questions only' })
    fireEvent.click(bookmarkFilterToggle)

    expect(selectedTagChips().queryByText('Fundamentals & Architecture')).toBeNull()
    expect(screen.getByPlaceholderText('Showing all questions')).toBeDefined()
  })

  test('re-mounting the same topic reuses the cache — no second fetch', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/topics/angular']}>
        <Routes>
          <Route path="/topics/:topicId" element={<TopicPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findAllByText('Angular')
    unmount()

    render(
      <MemoryRouter initialEntries={['/topics/angular']}>
        <Routes>
          <Route path="/topics/:topicId" element={<TopicPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findAllByText('Angular')

    // 2 fetches (topic + references) for the whole test, not 4.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('clicking the reload button forces a fresh fetch even though the topic is cached', async () => {
    renderAt('/topics/angular')
    await screen.findAllByText('Angular')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: 'Reload topic' }))
    await screen.findAllByText('Angular')

    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
