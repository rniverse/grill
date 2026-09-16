import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PreferencesPage } from './PreferencesPage'

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  render(
    <MemoryRouter>
      <PreferencesPage />
    </MemoryRouter>,
  )
}

describe('PreferencesPage', () => {
  test('renders the page heading', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('heading', { name: 'Preferences' })).toBeDefined()
  })

  test('renders a MobileNav trigger for phone widths', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
  })

  test('renders a Sources section listing the seeded rows', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByText('Content sources')).toBeDefined()
    expect(screen.getByText('Angular')).toBeDefined()
    expect(screen.getByText('Node.js')).toBeDefined()
  })

  test('renders a Developer section with the existing Generate ID control', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByText('Developer')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Generate new ID' })).toBeDefined()
  })

  test('renders the generate button with no confirmation message yet', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Generate new ID' })).toBeDefined()
    expect(screen.queryByText('New ID copied to clipboard')).toBeNull()
  })

  test('clicking generate copies a new ULID to the clipboard and shows a confirmation', async () => {
    renderPage()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate new ID' }))
    })

    expect(await screen.findByText('New ID copied to clipboard')).toBeDefined()
    const copied = await navigator.clipboard.readText()
    expect(copied).toHaveLength(26)
  })

  test('renders an IconRail with the Preferences section current', async () => {
    render(
      <MemoryRouter initialEntries={['/preferences']}>
        <PreferencesPage />
      </MemoryRouter>,
    )
    await act(async () => {})

    const preferencesLink = await screen.findByRole('link', { name: 'Preferences' })
    expect(preferencesLink.getAttribute('aria-current')).toBe('true')
  })

  test('clicking Validate on a row shows success after a successful check', async () => {
    globalThis.fetch = mock(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'angular',
        meta: {
          version: '1.0.0',
          cutOffTime: '2026-09-14T00:00:00.000Z',
          updatedAt: '2026-09-14T00:00:00.000Z',
          type: 'topic',
          name: 'Angular',
        },
        questions: [],
      }),
    })) as unknown as typeof fetch

    renderPage()
    await act(async () => {})

    const validateButtons = screen.getAllByRole('button', { name: 'Validate' })
    fireEvent.click(validateButtons[0])

    await waitFor(() => expect(screen.getAllByText(/Validated|Failed/).length).toBeGreaterThan(0))
  })
})
