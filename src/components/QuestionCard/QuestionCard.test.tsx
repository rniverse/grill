import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import type { Question, Reference } from '@/types/topic.types'

const question: Question = {
  id: 'q1',
  question: 'What is a Buffer?',
  tags: ['core'],
  references: ['r1'],
  related: [],
  answer: { type: 'md-text', value: 'A Buffer holds raw bytes.' },
}
const references: Reference[] = [{ id: 'r1', term: 'Buffer', text: 'Raw memory container.' }]

describe('QuestionCard', () => {
  test('shows the question text and ordinal always', () => {
    render(<QuestionCard ordinal="01" question={question} references={references} open={false} onToggle={() => {}} onReferenceSelect={() => {}} />)
    expect(screen.getByText('01')).toBeDefined()
    expect(screen.getByText('What is a Buffer?')).toBeDefined()
    expect(screen.queryByText('A Buffer holds raw bytes.', { exact: false })).toBeNull()
  })

  test('shows the answer body only when open', () => {
    render(<QuestionCard ordinal="01" question={question} references={references} open={true} onToggle={() => {}} onReferenceSelect={() => {}} />)
    expect(screen.getByText('holds raw bytes.', { exact: false })).toBeDefined()
  })

  test('toggle button calls onToggle', () => {
    let toggled = false
    render(<QuestionCard ordinal="01" question={question} references={references} open={false} onToggle={() => (toggled = true)} onReferenceSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'What is a Buffer?' }))
    expect(toggled).toBe(true)
  })
})
