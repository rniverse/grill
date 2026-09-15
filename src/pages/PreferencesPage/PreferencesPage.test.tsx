import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act, fireEvent } from '@testing-library/react'
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

    const preferencesLink = await screen.findByRole('link', { name: 'Preferences' })
    expect(preferencesLink.getAttribute('aria-current')).toBe('true')
  })
})
