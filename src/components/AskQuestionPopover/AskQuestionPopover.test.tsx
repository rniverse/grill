import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { AskQuestionPopover } from './AskQuestionPopover'

describe('AskQuestionPopover', () => {
  test('renders the quoted selection text', () => {
    render(
      <AskQuestionPopover quote="Event Loop" position={{ x: 10, y: 20 }} onSave={() => {}} onCancel={() => {}} />,
    )
    expect(screen.getByText('Event Loop')).toBeDefined()
  })

  test('save is disabled until the textarea has non-whitespace text', () => {
    render(<AskQuestionPopover quote="Event Loop" position={{ x: 0, y: 0 }} onSave={() => {}} onCancel={() => {}} />)

    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(saveButton.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText('What do you want to know?'), { target: { value: '   ' } })
    expect(saveButton.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText('What do you want to know?'), {
      target: { value: 'Why does this run last?' },
    })
    expect(saveButton.hasAttribute('disabled')).toBe(false)
  })

  test('clicking save calls onSave with the trimmed text', () => {
    const captured: { saved: string | null } = { saved: null }
    render(
      <AskQuestionPopover
        quote="Event Loop"
        position={{ x: 0, y: 0 }}
        onSave={(text) => (captured.saved = text)}
        onCancel={() => {}}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('What do you want to know?'), {
      target: { value: '  why is this last?  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(captured.saved).toBe('why is this last?')
  })

  test('clicking cancel calls onCancel', () => {
    let cancelled = false
    render(
      <AskQuestionPopover
        quote="Event Loop"
        position={{ x: 0, y: 0 }}
        onSave={() => {}}
        onCancel={() => (cancelled = true)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(cancelled).toBe(true)
  })
})
