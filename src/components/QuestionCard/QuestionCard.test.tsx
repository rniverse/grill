import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
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

  test('shows the existing personal note and an edit control when one exists', () => {
    savePersonalNote({ kind: 'question', id: 'q1' }, topic, 'My own note about buffers.')
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
    expect(screen.getByText('My own note about buffers.', { exact: false })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Edit note' })).toBeDefined()
  })
})
