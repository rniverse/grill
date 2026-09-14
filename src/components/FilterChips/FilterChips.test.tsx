import { describe, expect, mock, test } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import { FilterChips } from './FilterChips'

describe('FilterChips', () => {
  test('renders a toggle per tag and marks the active one pressed', () => {
    render(<FilterChips tags={['All', 'core']} active="core" onSelect={() => {}} />)

    const activeButton = screen.getByRole('button', { name: 'core' })
    expect(activeButton.getAttribute('aria-pressed')).toBe('true')
    const inactiveButton = screen.getByRole('button', { name: 'All' })
    expect(inactiveButton.getAttribute('aria-pressed')).toBe('false')
  })

  test('calls onSelect with the clicked tag', () => {
    const onSelect = mock()
    render(<FilterChips tags={['All', 'core']} active="core" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'All' }))

    expect(onSelect).toHaveBeenCalledWith('All')
  })

  test('clicking the already-active chip is a no-op', () => {
    const onSelect = mock()
    render(<FilterChips tags={['All', 'core']} active="core" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'core' }))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
