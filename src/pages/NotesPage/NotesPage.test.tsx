import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NotesPage } from './NotesPage'
import { savePersonalNote } from '@/services/storage'
import { topic as angularTopic, questions as angularQuestions } from '@/topics/angular'

const angularQuestion = angularQuestions[0]!

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

describe('NotesPage', () => {
  test('renders the page heading', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('heading', { name: 'My notes' })).toBeDefined()
  })

  test('shows the empty state with no notes', async () => {
    renderPage()

    expect(await screen.findByText('No notes yet.')).toBeDefined()
  })

  test('shows a truncated preview of long notes', async () => {
    const longText = 'a'.repeat(100)
    savePersonalNote({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' }, longText)

    renderPage()

    expect(await screen.findByText(`${'a'.repeat(80)}…`)).toBeDefined()
  })

  test('a note links to its topic page', async () => {
    savePersonalNote({ kind: 'question', id: angularQuestion.id }, { name: angularTopic.name, version: '1.0.0' }, 'short note')

    renderPage()

    const link = await screen.findByRole('link', { name: 'short note' })
    expect(link.getAttribute('href')).toBe('/topics/angular')
  })
})
