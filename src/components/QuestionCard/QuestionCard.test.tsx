import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import type { Question, Reference } from '@/types/topic.types'
import { isBookmarked, savePersonalNote } from '@/services/storage'

const topic = { name: 'nodejs', version: '1.0.0' }

const question: Question = {
  id: 'q1',
  question: 'What is a Buffer?',
  tags: ['core'],
  references: ['r1'],
  related: [],
  answer: { type: 'markdown.text', value: 'A Buffer holds raw bytes.' },
}
const references: Reference[] = [{ id: 'r1', term: 'Buffer', text: { type: 'markdown.text', value: 'Raw memory container.' } }]

beforeEach(() => {
  localStorage.clear()
})

describe('QuestionCard', () => {
  test('shows the question text and ordinal always', () => {
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={false}
        onToggle={() => {}}
        onReferenceSelect={() => {}}
      />,
    )
    expect(screen.getByText('01')).toBeDefined()
    expect(screen.getByText('What is a Buffer?')).toBeDefined()
    expect(screen.queryByText('A Buffer holds raw bytes.', { exact: false })).toBeNull()
  })

  test('shows the answer body only when open', () => {
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={true}
        onToggle={() => {}}
        onReferenceSelect={() => {}}
      />,
    )
    expect(screen.getByText('holds raw bytes.', { exact: false })).toBeDefined()
  })

  test('toggle button calls onToggle', () => {
    let toggled = false
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={false}
        onToggle={() => (toggled = true)}
        onReferenceSelect={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'What is a Buffer?' }))
    expect(toggled).toBe(true)
  })

  test('bookmark button toggles independently of the header toggle', () => {
    let toggled = false
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={false}
        onToggle={() => (toggled = true)}
        onReferenceSelect={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }))

    expect(isBookmarked({ kind: 'question', id: 'q1' })).toBe(true)
    expect(toggled).toBe(false)
  })

  test('shows an "add a note" control when open and no personal note exists yet', () => {
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={true}
        onToggle={() => {}}
        onReferenceSelect={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Add a note' })).toBeDefined()
  })

  test('shows view and remove controls (not add) when a note exists', () => {
    savePersonalNote('My own note about buffers.', { target: { kind: 'question', id: 'q1' }, topic })
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={true}
        onToggle={() => {}}
        onReferenceSelect={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Read full note' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Delete note' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Add a note' })).toBeNull()
  })

  test('clicking the view control opens a dialog with the note rendered as markdown, plus edit/delete', () => {
    savePersonalNote('**bold** note about buffers.', { target: { kind: 'question', id: 'q1' }, topic })
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={true}
        onToggle={() => {}}
        onReferenceSelect={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Read full note' }))

    const dialog = screen.getByRole('dialog')
    const bold = within(dialog).getByText('bold')
    expect(bold.tagName).toBe('STRONG')
    expect(within(dialog).getByRole('button', { name: 'Edit note' })).toBeDefined()
  })

  test('deleting a note from the dialog removes it', () => {
    savePersonalNote('a note to delete', { target: { kind: 'question', id: 'q1' }, topic })
    render(
      <QuestionCard
        ordinal="01"
        question={question}
        references={references}
        topic={topic}
        open={true}
        onToggle={() => {}}
        onReferenceSelect={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Read full note' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete note' }))

    expect(screen.getByRole('button', { name: 'Add a note' })).toBeDefined()
  })
})
