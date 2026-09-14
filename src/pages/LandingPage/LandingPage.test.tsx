import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'
import { listBookmarks } from '@/services/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('LandingPage', () => {
  test('renders a row for each configured topic once loaded', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    const angularRow = await screen.findByText('Angular')
    expect(angularRow).toBeDefined()
  })

  test('renders the CONTENTS label and search/import controls', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    await screen.findByText('Angular')
    expect(screen.getByText('Contents')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Search' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDefined()
  })

  test('selecting a valid export file imports it into the personal layer', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    await screen.findByText('Angular')

    const snapshot = {
      pendingQuestions: [],
      personalNotes: [],
      bookmarks: [
        {
          id: 'b1',
          topic: { name: 'nodejs', version: '1.0.0' },
          target: { kind: 'question', id: 'q1' },
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    }
    const file = new File([JSON.stringify(snapshot)], 'export.json', { type: 'application/json' })

    fireEvent.change(screen.getByLabelText('Import'), { target: { files: [file] } })

    await waitFor(() => expect(listBookmarks()).toHaveLength(1))
    expect(screen.queryByText('Could not import — check the file and try again.')).toBeNull()
  })

  test('selecting an invalid file shows an import error', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    await screen.findByText('Angular')

    const file = new File(['not json'], 'export.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('Import'), { target: { files: [file] } })

    expect(await screen.findByText('Could not import — check the file and try again.')).toBeDefined()
  })
})
