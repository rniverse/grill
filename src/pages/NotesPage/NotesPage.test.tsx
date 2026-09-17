import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NotesPage } from './NotesPage'
import { NoteDetailPage } from '@/pages/NoteDetailPage/NoteDetailPage'
import { storage } from '@/services/storage'
import { contentCache } from '@/services/content-cache'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions
const angularReferences = angularReferencesData.references

const angularQuestion = angularQuestions[0]
const angularReference = angularReferences[0]

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
  render(
    <MemoryRouter>
      <NotesPage />
    </MemoryRouter>,
  )
}

function renderWithNoteRoute() {
  render(
    <MemoryRouter initialEntries={['/notes']}>
      <Routes>
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/:noteId" element={<NoteDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NotesPage', () => {
  test('renders the page heading', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('heading', { name: 'My notes' })).toBeDefined()
  })

  test('renders a MobileNav trigger for phone widths', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
  })

  test('renders an Add note button', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Add a note' })).toBeDefined()
  })

  test('shows the empty state with no notes', async () => {
    renderPage()

    expect(await screen.findByText('No notes yet.')).toBeDefined()
  })

  test('shows a truncated preview of long notes', async () => {
    const longText = 'a'.repeat(100)
    storage.create.note(longText, {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()

    expect(await screen.findByText(`${'a'.repeat(80)}…`)).toBeDefined()
  })

  test('clicking a note about a question navigates to its own page with a go-to-question button', async () => {
    storage.create.note('a note tied to a question', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderWithNoteRoute()
    fireEvent.click(await screen.findByText('a note tied to a question'))

    const link = await screen.findByRole('link', { name: 'Go to question' })
    expect(link.getAttribute('href')).toBe(`/topics/angular?question=${angularQuestion.id}`)
  })

  test('clicking a standalone note (no target) navigates to its own page with no go-to button', async () => {
    storage.create.note('a freeform note')

    renderWithNoteRoute()
    fireEvent.click(await screen.findByText('a freeform note'))

    await screen.findByRole('button', { name: 'Edit note' })
    expect(screen.queryByText('Go to question')).toBeNull()
  })

  test('clicking Add a note opens the editor with an empty, disabled Save', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Add a note' }))

    const saveButton = await screen.findByRole('button', { name: 'Save' })
    expect(saveButton.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined()
  })

  test('removing a note from the list deletes it', async () => {
    storage.create.note('a note to remove')

    renderPage()
    await screen.findByText('a note to remove')

    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }))

    expect(storage.list.personal.notes()).toEqual([])
    expect(await screen.findByText('No notes yet.')).toBeDefined()
  })

  test('a standalone note shows an "Out of box" chip and no target label', async () => {
    storage.create.note('a freeform note')

    renderPage()

    expect(await screen.findByText('a freeform note')).toBeDefined()
    expect(await screen.findByText('Out of box')).toBeDefined()
  })

  test('a note on a question shows a topic+type chip and resolves the real question text', async () => {
    storage.create.note('my thoughts', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()

    expect(await screen.findByText('Angular (Question)')).toBeDefined()
    expect(await screen.findByText(angularQuestion.question)).toBeDefined()
  })

  test('a note on a reference shows a topic+type chip and resolves the real reference term', async () => {
    storage.create.note('my thoughts', {
      target: { kind: 'reference', id: angularReference.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()

    expect(await screen.findByText('Angular (Reference)')).toBeDefined()
    expect(await screen.findByText(angularReference.term)).toBeDefined()
  })

  test('a note on a question only fetches the topic file, never references', async () => {
    storage.create.note('my thoughts', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()
    await screen.findByText(angularQuestion.question)

    const fetchedUrls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(fetchedUrls.some((url) => url.includes('/topics/angular'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/references/angular'))).toBe(false)
  })

  test('the chip sits after the item content, not before it', async () => {
    storage.create.note('my thoughts', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()

    const label = await screen.findByText('my thoughts')
    const chip = await screen.findByText('Angular (Question)')

    expect(label.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('the resolved question text sits above the note preview', async () => {
    storage.create.note('my thoughts', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()

    const label = await screen.findByText('my thoughts')
    const target = await screen.findByText(angularQuestion.question)

    expect(target.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('the resolved reference term sits above the note preview', async () => {
    storage.create.note('my thoughts', {
      target: { kind: 'reference', id: angularReference.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })

    renderPage()

    const label = await screen.findByText('my thoughts')
    const target = await screen.findByText(angularReference.term)

    expect(target.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
