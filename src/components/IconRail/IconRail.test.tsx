import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { IconRail } from './IconRail'
import { RailSection } from './rail-section.enum'
import { savePersonalNote } from '@/services/storage'

beforeEach(() => {
  localStorage.clear()
})

function renderRail(activeSection: RailSection = RailSection.Topics, topicId?: string) {
  render(
    <MemoryRouter>
      <IconRail activeSection={activeSection} topicId={topicId} />
    </MemoryRouter>,
  )
}

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

  test('clicking export downloads the current personal layer as a JSON blob', async () => {
    savePersonalNote({ kind: 'question', id: 'q1' }, { name: 'nodejs', version: '1.0.0' }, 'a note')

    const createdUrls: string[] = []
    const revokedUrls: string[] = []
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    let capturedBlob: Blob | null = null

    URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      const url = 'blob:mock-url'
      createdUrls.push(url)
      return url
    }
    URL.revokeObjectURL = (url: string) => {
      revokedUrls.push(url)
    }

    try {
      render(<IconRail activeSection={RailSection.Topics} />)
      fireEvent.click(screen.getByRole('button', { name: 'Export personal layer' }))

      expect(createdUrls).toHaveLength(1)
      expect(capturedBlob).not.toBeNull()
      expect((capturedBlob as unknown as Blob).type).toBe('application/json')

      // revokeObjectURL is deferred with setTimeout — let it fire.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(revokedUrls).toEqual(createdUrls)
    } finally {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    }
  })

  test('no panel is open by default', () => {
    renderRail()

    expect(screen.queryByRole('button', { name: 'Close panel' })).toBeNull()
  })

  test('clicking a rail button opens its panel', () => {
    renderRail()

    fireEvent.click(screen.getByRole('button', { name: 'Bookmarks' }))

    expect(screen.getByText('Bookmarks')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Bookmarks' }).getAttribute('aria-expanded')).toBe('true')
  })

  test('clicking the same rail button again closes its panel', () => {
    renderRail()

    const bookmarksButton = screen.getByRole('button', { name: 'Bookmarks' })
    fireEvent.click(bookmarksButton)
    fireEvent.click(bookmarksButton)

    expect(screen.queryByRole('button', { name: 'Close panel' })).toBeNull()
    expect(bookmarksButton.getAttribute('aria-expanded')).toBe('false')
  })

  test('clicking a different rail button switches the open panel', () => {
    renderRail()

    fireEvent.click(screen.getByRole('button', { name: 'Bookmarks' }))
    fireEvent.click(screen.getByRole('button', { name: 'My notes' }))

    expect(screen.getByRole('button', { name: 'Bookmarks' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByRole('button', { name: 'My notes' }).getAttribute('aria-expanded')).toBe('true')
  })

  test("the panel's close button closes it", () => {
    renderRail()

    fireEvent.click(screen.getByRole('button', { name: 'Bookmarks' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }))

    expect(screen.queryByRole('button', { name: 'Close panel' })).toBeNull()
  })
})
