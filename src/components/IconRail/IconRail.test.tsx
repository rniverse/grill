import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { IconRail } from './IconRail'
import { savePersonalNote } from '@/services/storage'

beforeEach(() => {
  localStorage.clear()
})

function renderRail(initialPath = '/') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <IconRail />
    </MemoryRouter>,
  )
}

describe('IconRail', () => {
  test('renders a link per rail section, plus a logo link and export button', () => {
    renderRail()

    expect(screen.getByRole('link', { name: 'Prep' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Topics' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'References' }).getAttribute('href')).toBe('/references')
    expect(screen.getByRole('link', { name: 'Bookmarks' }).getAttribute('href')).toBe('/bookmarks')
    expect(screen.getByRole('link', { name: 'My questions' }).getAttribute('href')).toBe('/questions')
    expect(screen.getByRole('link', { name: 'My notes' }).getAttribute('href')).toBe('/notes')
    expect(screen.getByRole('button', { name: 'Export personal layer' })).toBeDefined()
  })

  test('the logo links back to the topics landing page', () => {
    renderRail('/topics/angular')

    expect(screen.getByRole('link', { name: 'Prep' }).getAttribute('href')).toBe('/')
  })

  test('marks Topics as current on the landing route', () => {
    renderRail('/')

    expect(screen.getByRole('link', { name: 'Topics' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('link', { name: 'References' }).getAttribute('aria-current')).toBeNull()
  })

  test('marks Topics as current on a /topics/:id route', () => {
    renderRail('/topics/angular')

    expect(screen.getByRole('link', { name: 'Topics' }).getAttribute('aria-current')).toBe('true')
  })

  test('marks References as current on /references and /references/:id routes', () => {
    renderRail('/references')
    expect(screen.getByRole('link', { name: 'References' }).getAttribute('aria-current')).toBe('true')
  })

  test('marks Bookmarks as current on the /bookmarks route', () => {
    renderRail('/bookmarks')

    expect(screen.getByRole('link', { name: 'Bookmarks' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('link', { name: 'Topics' }).getAttribute('aria-current')).toBeNull()
  })

  test('marks Questions as current on the /questions route', () => {
    renderRail('/questions')

    expect(screen.getByRole('link', { name: 'My questions' }).getAttribute('aria-current')).toBe('true')
  })

  test('marks Notes as current on the /notes route', () => {
    renderRail('/notes')

    expect(screen.getByRole('link', { name: 'My notes' }).getAttribute('aria-current')).toBe('true')
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
      renderRail()
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
})
