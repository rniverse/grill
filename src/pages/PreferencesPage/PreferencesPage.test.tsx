import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PreferencesPage } from './PreferencesPage'
import { storage } from '@/services/storage'
import { contentCache } from '@/services/content-cache'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

function fixtureFor(url: string): unknown {
  if (url.includes('/topics/angular')) return angularTopicData
  if (url.includes('/references/angular')) return angularReferencesData
  if (url.includes('/topics/nodejs')) return nodejsTopicData
  if (url.includes('/references/nodejs')) return nodejsReferencesData
  throw new Error(`no fixture for ${url}`)
}

beforeEach(() => {
  localStorage.clear()
  contentCache.clear()
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

  test('renders left nav with Content sources and Developer, Content sources active by default', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Content sources' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Developer' })).toBeDefined()
    expect(screen.getByText('Angular')).toBeDefined()
    expect(screen.getByText('Node.js')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Generate new ID' })).toBeNull()
  })

  test('clicking Developer switches the right panel to the Generate ID control', async () => {
    renderPage()
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: 'Developer' }))

    expect(screen.getByRole('button', { name: 'Generate new ID' })).toBeDefined()
    expect(screen.queryByText('Angular')).toBeNull()
  })

  test('clicking generate copies a new ULID to the clipboard and shows a confirmation', async () => {
    renderPage()
    await act(async () => {})
    fireEvent.click(screen.getByRole('button', { name: 'Developer' }))

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
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
    }) as unknown as typeof fetch

    renderPage()
    await act(async () => {})

    // Angular is the first row in CONTENT_SOURCES.
    const validateButtons = screen.getAllByRole('button', { name: 'Validate' })
    fireEvent.click(validateButtons[0])

    await waitFor(() => expect(screen.getByText('Topic: checked at', { exact: false })).toBeDefined())
    expect(screen.getByText('References: checked at', { exact: false })).toBeDefined()
    expect(screen.queryByText('check failed', { exact: false })).toBeNull()

    const sources = storage.list.sources()
    const angular = sources.find((source) => source.id === 'angular')
    expect(angular?.validation?.topic?.status).toBe('success')
    expect(angular?.validation?.references?.status).toBe('success')
  })

  test('Validate writes through to the shared content cache — a later page read hits no new fetch', async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    renderPage()
    await act(async () => {})

    fireEvent.click(screen.getAllByRole('button', { name: 'Validate' })[0])
    await waitFor(() => expect(screen.getByText('References: checked at', { exact: false })).toBeDefined())
    const callsAfterValidate = fetchMock.mock.calls.length

    const angular = storage.list.sources().find((source) => source.id === 'angular')
    if (!angular) throw new Error('expected the angular source to exist')
    await contentCache.resolve.topic(angular)
    await contentCache.resolve.references(angular)

    expect(fetchMock.mock.calls.length).toBe(callsAfterValidate)
  })

  test('Add source opens a dialog and creates a new row on save', async () => {
    renderPage()
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: 'Add source' }))
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'react' } })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'React' } })
    fireEvent.change(screen.getByLabelText('Topic source'), {
      target: { value: 'https://example.test/react.json' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('React')).toBeDefined()
    expect(storage.list.sources()).toHaveLength(3)
  })

  test('Add source with a duplicate id shows an inline error and does not close the dialog', async () => {
    renderPage()
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: 'Add source' }))
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'angular' } })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Angular Again' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('A source with this ID already exists.')).toBeDefined()
    expect(screen.getByLabelText('ID')).toBeDefined() // dialog still open
    expect(storage.list.sources()).toHaveLength(2)
  })

  test('Edit updates a row and preserves its id', async () => {
    renderPage()
    await act(async () => {})

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    fireEvent.click(editButtons[0])

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Angular (renamed)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Angular (renamed)')).toBeDefined()
    const sources = storage.list.sources()
    expect(sources.find((source) => source.id === 'angular')?.name).toBe('Angular (renamed)')
    expect(sources).toHaveLength(2)
  })

  test('Delete removes a row', async () => {
    renderPage()
    await act(async () => {})

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete source' })
    fireEvent.click(deleteButtons[0])

    expect(screen.queryByText('Angular')).toBeNull()
    expect(storage.list.sources().map((source) => source.id)).toEqual(['nodejs'])
  })
})
