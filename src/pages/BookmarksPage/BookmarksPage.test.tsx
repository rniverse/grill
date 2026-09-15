import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BookmarksPage } from './BookmarksPage'
import { toggleBookmark } from '@/services/storage'
import { topic as angularTopic, questions as angularQuestions } from '@/topics/angular'

const angularQuestion = angularQuestions[0]!

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  render(
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

  test('shows the empty state with no bookmarks', async () => {
    renderPage()

    expect(await screen.findByText('Nothing bookmarked yet.')).toBeDefined()
  })

  test('resolves a bookmarked question to its text, across topics', async () => {
    toggleBookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    expect(await screen.findByText(angularQuestion.question)).toBeDefined()
  })

  test('a bookmark links to its topic page', async () => {
    toggleBookmark({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' })

    renderPage()

    const link = await screen.findByRole('link', { name: angularQuestion.question })
    expect(link.getAttribute('href')).toBe('/topics/angular')
  })

  test('renders an IconRail with the Bookmarks section current', async () => {
    render(
      <MemoryRouter initialEntries={['/bookmarks']}>
        <BookmarksPage />
      </MemoryRouter>,
    )

    const bookmarksLink = await screen.findByRole('link', { name: 'Bookmarks' })
    expect(bookmarksLink.getAttribute('aria-current')).toBe('true')
  })
})
