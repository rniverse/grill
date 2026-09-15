import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteEditor } from './NoteEditor'

describe('NoteEditor', () => {
  test('renders the initial value', () => {
    render(<NoteEditor initialValue="A first draft note." onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('A first draft note.', { exact: false })).toBeDefined()
  })

  test('clicking cancel calls onCancel', () => {
    let cancelled = false
    render(<NoteEditor initialValue="" onSave={() => {}} onCancel={() => (cancelled = true)} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(cancelled).toBe(true)
  })

  test('clicking save calls onSave with the exact text, untouched', () => {
    const captured: { saved: string | null } = { saved: null }
    render(
      <NoteEditor
        initialValue="- a bullet, not a star"
        onSave={(text) => (captured.saved = text)}
        onCancel={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(captured.saved).toBe('- a bullet, not a star')
  })

  test('save is disabled when the note is empty', () => {
    render(<NoteEditor initialValue="" onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(true)
  })

  test('save is disabled when the note is only whitespace', () => {
    render(<NoteEditor initialValue="   " onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(true)
  })

  test('save is enabled once the note has non-whitespace content', () => {
    render(<NoteEditor initialValue="A first draft note." onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(false)
  })
})
