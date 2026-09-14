import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteView } from './NoteView'
import type { PersonalNote } from '@/types/personal.types'

const topic = { name: 'nodejs', version: '1.0.0' }
const target = { kind: 'question' as const, id: 'q1' }

function note(overrides: Partial<PersonalNote>): PersonalNote {
  return {
    id: 'n1',
    topic,
    target,
    text: 'A short personal note.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('NoteView', () => {
  test('renders a short note inline with no expand button', () => {
    render(<NoteView note={note({ text: 'A short personal note.' })} />)

    expect(screen.getByText('A short personal note.', { exact: false })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Read full note' })).toBeNull()
  })

  test('renders an expand button for a note over the character limit', () => {
    const longText = 'x'.repeat(1001)
    render(<NoteView note={note({ text: longText })} />)

    expect(screen.getByRole('button', { name: 'Read full note' })).toBeDefined()
  })

  test('renders an expand button for a note over the word limit', () => {
    const longText = Array.from({ length: 101 }, () => 'word').join(' ')
    render(<NoteView note={note({ text: longText })} />)

    expect(screen.getByRole('button', { name: 'Read full note' })).toBeDefined()
  })

  test('clicking expand opens a dialog with the full note text', () => {
    const longText = 'x'.repeat(1001)
    render(<NoteView note={note({ text: longText })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Read full note' }))

    expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDefined()
  })
})
