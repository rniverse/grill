import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NotesPage } from './NotesPage'
import { NoteDetailPage } from '@/pages/NoteDetailPage/NoteDetailPage'
import { storage } from '@/services/storage'
import angularTopicData from '@/topics/angular.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions

const angularQuestion = angularQuestions[0]

beforeEach(() => {
  localStorage.clear()
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
})
