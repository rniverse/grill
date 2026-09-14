import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { AnswerBody } from './AnswerBody'
import type { Reference } from '@/types/topic.types'

const bufferRef: Reference = { id: 'r1', term: 'Buffer', text: 'A raw-memory container.' }

describe('AnswerBody', () => {
  test('renders markdown paragraphs', () => {
    render(<AnswerBody text="Plain **bold** text." references={[]} onReferenceSelect={() => {}} />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
  })

  test('renders a fenced code block', () => {
    render(<AnswerBody text={'```js\nconst x = 1;\n```'} references={[]} onReferenceSelect={() => {}} />)
    expect(screen.getByText('const x = 1;').closest('pre')).not.toBeNull()
  })

  test('highlights a cited reference term as a clickable badge', () => {
    render(
      <AnswerBody text="A Buffer holds raw bytes." references={[bufferRef]} onReferenceSelect={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Buffer' })).toBeDefined()
  })
})
