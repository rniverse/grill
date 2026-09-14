import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteEditor } from './NoteEditor'

describe('NoteEditor', () => {
  test('renders the initial markdown value', async () => {
    render(<NoteEditor initialValue="A first draft note." onSave={() => {}} onCancel={() => {}} />)
    expect(await screen.findByText('A first draft note.', { exact: false })).toBeDefined()
  })

  test('clicking cancel calls onCancel', async () => {
    let cancelled = false
    render(<NoteEditor initialValue="" onSave={() => {}} onCancel={() => (cancelled = true)} />)
    await screen.findByRole('button', { name: 'Cancel' })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(cancelled).toBe(true)
  })

  test('clicking save calls onSave with the editor markdown', async () => {
    const captured: { saved: string | null } = { saved: null }
    render(
      <NoteEditor initialValue="A first draft note." onSave={(text) => (captured.saved = text)} onCancel={() => {}} />,
    )
    await screen.findByText('A first draft note.', { exact: false })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(captured.saved).toBe('A first draft note.')
  })

  test('save is disabled when the note is empty', async () => {
    render(<NoteEditor initialValue="" onSave={() => {}} onCancel={() => {}} />)
    const saveButton = await screen.findByRole('button', { name: 'Save' })

    expect(saveButton.hasAttribute('disabled')).toBe(true)
  })

  test('save is disabled when the note is only whitespace', async () => {
    render(<NoteEditor initialValue="   " onSave={() => {}} onCancel={() => {}} />)
    const saveButton = await screen.findByRole('button', { name: 'Save' })

    expect(saveButton.hasAttribute('disabled')).toBe(true)
  })

  test('save is enabled once the note has non-whitespace content', async () => {
    render(<NoteEditor initialValue="A first draft note." onSave={() => {}} onCancel={() => {}} />)
    await screen.findByText('A first draft note.', { exact: false })
    const saveButton = screen.getByRole('button', { name: 'Save' })

    expect(saveButton.hasAttribute('disabled')).toBe(false)
  })
})
