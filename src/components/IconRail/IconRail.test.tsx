import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { IconRail } from './IconRail'

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
  test('renders a link per rail section, plus a logo link', () => {
    renderRail()

    expect(screen.getByRole('link', { name: 'Grill' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Topics' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'References' }).getAttribute('href')).toBe('/references')
    expect(screen.getByRole('link', { name: 'Bookmarks' }).getAttribute('href')).toBe('/bookmarks')
    expect(screen.getByRole('link', { name: 'My questions' }).getAttribute('href')).toBe('/questions')
    expect(screen.getByRole('link', { name: 'My notes' }).getAttribute('href')).toBe('/notes')
  })

  test('the logo links back to the topics landing page', () => {
    renderRail('/topics/angular')

    expect(screen.getByRole('link', { name: 'Grill' }).getAttribute('href')).toBe('/')
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

  test('marks Preferences as current on the /preferences route', () => {
    renderRail('/preferences')

    expect(screen.getByRole('link', { name: 'Preferences' }).getAttribute('aria-current')).toBe('true')
  })
})
