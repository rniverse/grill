import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NoteDetailPage } from './NoteDetailPage'
import { storage } from '@/services/storage'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestion = angularTopicData.questions[0]

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
        <Route path="/notes/:noteId" element={<NoteDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NoteDetailPage', () => {
  test('renders the note content, rendered through markdown', async () => {
    const note = storage.create.note('**bold** freeform note')
    renderAt(`/notes/${note.id}`)

    const bold = await screen.findByText('bold')
    expect(bold.tagName).toBe('STRONG')
  })

  test('a standalone note (no target) shows no go-to-question button', async () => {
    const note = storage.create.note('a freeform note')
    renderAt(`/notes/${note.id}`)

    await screen.findByRole('button', { name: 'Edit note' })
    expect(screen.queryByText('Go to question')).toBeNull()
    expect(screen.queryByText('Go to reference')).toBeNull()
  })

  test('shows a not-found message for an unknown note id', async () => {
    renderAt('/notes/does-not-exist')

    expect(await screen.findByText('Note not found.')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Back to notes' }).getAttribute('href')).toBe('/notes')
  })

  test('a note about a question shows a go-to-question button before Edit', async () => {
    const note = storage.create.note('a note about a question', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })
    renderAt(`/notes/${note.id}`)

    const goto = await screen.findByRole('link', { name: 'Go to question' })
    expect(goto.getAttribute('href')).toBe(`/topics/angular?question=${angularQuestion.id}`)
  })

  test('a note with a local ref shows the topic chip and the question it was made on', async () => {
    const note = storage.create.note('a note about a question', {
      target: { kind: 'question', id: angularQuestion.id },
      topic: { name: angularTopic.name, version: '1.0.0' },
    })
    renderAt(`/notes/${note.id}`)

    expect(await screen.findByText('Angular')).toBeDefined()
    expect(await screen.findByText(angularQuestion.question)).toBeDefined()
  })

  test('a standalone note shows no topic chip or target label', async () => {
    const note = storage.create.note('a freeform note')
    renderAt(`/notes/${note.id}`)

    await screen.findByRole('button', { name: 'Edit note' })
    expect(screen.queryByText('Angular')).toBeNull()
  })

  test('editing updates the note text and keeps the same id', async () => {
    const note = storage.create.note('original text')
    renderAt(`/notes/${note.id}`)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit note' }))
    await screen.findAllByText('original text')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const notes = storage.list.personal.notes()
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe(note.id)
  })

  test('removing the note deletes it and navigates back to the notes list', async () => {
    const note = storage.create.note('to be removed')
    render(
      <MemoryRouter initialEntries={[`/notes/${note.id}`]}>
        <Routes>
          <Route path="/notes" element={<p>notes list</p>} />
          <Route path="/notes/:noteId" element={<NoteDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Delete note' }))

    expect(storage.list.personal.notes()).toEqual([])
    expect(await screen.findByText('notes list')).toBeDefined()
  })
})
