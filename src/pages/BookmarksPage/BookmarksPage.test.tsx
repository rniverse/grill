import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BookmarksPage } from './BookmarksPage'
import { storage } from '@/services/storage'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions
const angularReferences = angularReferencesData.references

const angularQuestion = angularQuestions[0]
const angularReference = angularReferences[0]

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

  test('renders a MobileNav trigger for phone widths', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
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
