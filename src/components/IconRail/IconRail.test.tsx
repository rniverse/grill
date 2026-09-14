import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { IconRail } from './IconRail'
import { RailSection } from './rail-section.enum'

describe('IconRail', () => {
  test('marks the active section button', () => {
    render(<IconRail activeSection={RailSection.Topics} />)

    const topicsButton = screen.getByRole('button', { name: 'Topics' })
    expect(topicsButton.getAttribute('aria-current')).toBe('true')

    const referencesButton = screen.getByRole('button', { name: 'References' })
    expect(referencesButton.getAttribute('aria-current')).toBeNull()
  })

  test('renders one button per rail section plus export', () => {
    render(<IconRail activeSection={RailSection.Topics} />)

    expect(screen.getByRole('button', { name: 'Topics' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'References' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Bookmarks' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'My questions' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'My notes' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Export personal layer' })).toBeDefined()
  })
})
