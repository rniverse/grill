import { beforeEach, describe, expect, test } from 'bun:test'
import { useRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectionPlusButton } from './SelectionPlusButton'
import { storage } from '@/services/storage'

const topic = { name: 'nodejs', version: '1.0.0' }
const target = { kind: 'question' as const, id: 'q1' }

function Harness({ onSaved }: { onSaved?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <div>
      <div ref={containerRef}>The Event Loop hands CPU work to libuv.</div>
      <SelectionPlusButton containerRef={containerRef} topic={topic} target={target} onSaved={onSaved} />
    </div>
  )
}

function selectWithinContainer(container: HTMLElement, start: number, end: number): void {
  const range = document.createRange()
  range.setStart(container.firstChild as Text, start)
  range.setEnd(container.firstChild as Text, end)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

beforeEach(() => {
  localStorage.clear()
})

describe('SelectionPlusButton', () => {
  test('shows nothing until a real selection is made', () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Ask about this selection' })).toBeNull()
  })

  test('appears after a valid text selection and mouseup, positioned from the event', () => {
    render(<Harness />)
    const container = screen.getByText(/The Event Loop/, { exact: false })
    selectWithinContainer(container, 4, 14) // "Event Loop"

    fireEvent.mouseUp(container, { clientX: 100, clientY: 80 })

    const button = screen.getByRole('button', { name: 'Ask about this selection' })
    expect(button.style.left).toBe('110px')
    expect(button.style.top).toBe('66px')
  })

  test('a selection shorter than 4 characters does not show the button', () => {
    render(<Harness />)
    const container = screen.getByText(/The Event Loop/, { exact: false })
    selectWithinContainer(container, 0, 2) // "Th"

    fireEvent.mouseUp(container, { clientX: 10, clientY: 10 })

    expect(screen.queryByRole('button', { name: 'Ask about this selection' })).toBeNull()
  })

  test('clicking the button opens the ask popover with the selected quote', () => {
    render(<Harness />)
    const container = screen.getByText(/The Event Loop/, { exact: false })
    selectWithinContainer(container, 4, 14)
    fireEvent.mouseUp(container, { clientX: 100, clientY: 80 })

    fireEvent.click(screen.getByRole('button', { name: 'Ask about this selection' }))

    expect(screen.getByText('Event Loop')).toBeDefined()
    expect(screen.getByPlaceholderText('What do you want to know?')).toBeDefined()
  })

  test('saving the ask popover persists a PendingQuestion and calls onSaved', () => {
    let savedCount = 0
    render(<Harness onSaved={() => savedCount++} />)
    const container = screen.getByText(/The Event Loop/, { exact: false })
    selectWithinContainer(container, 4, 14)
    fireEvent.mouseUp(container, { clientX: 100, clientY: 80 })
    fireEvent.click(screen.getByRole('button', { name: 'Ask about this selection' }))

    fireEvent.change(screen.getByPlaceholderText('What do you want to know?'), {
      target: { value: 'How does this interact with microtasks?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const saved = storage.list.personal.questions()
    expect(saved).toHaveLength(1)
    expect(saved[0]?.ask).toBe('How does this interact with microtasks?')
    expect(saved[0]?.selection).toEqual({ text: 'Event Loop', range: { start: 4, end: 14 } })
    expect(saved[0]?.topic).toEqual(topic)
    expect(saved[0]?.target).toEqual(target)
    expect(savedCount).toBe(1)
    expect(screen.queryByPlaceholderText('What do you want to know?')).toBeNull()
  })

  test('cancelling the ask popover discards it without saving', () => {
    render(<Harness />)
    const container = screen.getByText(/The Event Loop/, { exact: false })
    selectWithinContainer(container, 4, 14)
    fireEvent.mouseUp(container, { clientX: 100, clientY: 80 })
    fireEvent.click(screen.getByRole('button', { name: 'Ask about this selection' }))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByPlaceholderText('What do you want to know?')).toBeNull()
    expect(storage.list.personal.questions()).toEqual([])
  })
})
