import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookmarkButton } from './BookmarkButton'
import { isBookmarked } from '@/services/storage'

const topic = { name: 'nodejs', version: '1.0.0' }
const target = { kind: 'question' as const, id: 'q1' }

beforeEach(() => {
  localStorage.clear()
})

describe('BookmarkButton', () => {
  test('starts unpressed when the target is not bookmarked', () => {
    render(<BookmarkButton topic={topic} target={target} />)
    expect(screen.getByRole('button', { name: 'Bookmark' }).getAttribute('aria-pressed')).toBe('false')
  })

  test('clicking bookmarks the target and flips to pressed', () => {
    render(<BookmarkButton topic={topic} target={target} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }))

    expect(isBookmarked(target)).toBe(true)
    expect(screen.getByRole('button', { name: 'Bookmarked' }).getAttribute('aria-pressed')).toBe('true')
  })

  test('clicking twice toggles back to unbookmarked', () => {
    render(<BookmarkButton topic={topic} target={target} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bookmarked' }))

    expect(isBookmarked(target)).toBe(false)
    expect(screen.getByRole('button', { name: 'Bookmark' }).getAttribute('aria-pressed')).toBe('false')
  })

  test('clicking does not bubble to an ancestor click handler', () => {
    let ancestorClicked = false
    render(
      <div onClick={() => (ancestorClicked = true)}>
        <BookmarkButton topic={topic} target={target} />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }))

    expect(ancestorClicked).toBe(false)
  })

  test('calls onToggle after persisting', () => {
    let toggledCount = 0
    render(<BookmarkButton topic={topic} target={target} onToggle={() => toggledCount++} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }))

    expect(toggledCount).toBe(1)
  })
})
