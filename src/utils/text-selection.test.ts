import { describe, expect, test } from 'bun:test'
import { captureSelection } from './text-selection'

function selectTextNode(node: Text, start: number, end: number): void {
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

describe('captureSelection', () => {
  test('captures the selected text and its character offsets', () => {
    const container = document.createElement('div')
    container.textContent = 'The Event Loop hands CPU work to libuv.'
    document.body.appendChild(container)

    selectTextNode(container.firstChild as Text, 4, 14)

    expect(captureSelection(container)).toEqual({ text: 'Event Loop', range: { start: 4, end: 14 } })

    document.body.removeChild(container)
  })

  test('trims surrounding whitespace out of both the text and the range', () => {
    const container = document.createElement('div')
    container.textContent = 'The Event Loop hands CPU work to libuv.'
    document.body.appendChild(container)

    selectTextNode(container.firstChild as Text, 3, 14) // ' Event Loop'

    expect(captureSelection(container)).toEqual({ text: 'Event Loop', range: { start: 4, end: 14 } })

    document.body.removeChild(container)
  })

  test('returns null when there is no selection', () => {
    const container = document.createElement('div')
    container.textContent = 'Some text.'
    document.body.appendChild(container)

    window.getSelection()?.removeAllRanges()

    expect(captureSelection(container)).toBeNull()

    document.body.removeChild(container)
  })

  test('returns null when the selection is collapsed', () => {
    const container = document.createElement('div')
    container.textContent = 'Some text.'
    document.body.appendChild(container)

    selectTextNode(container.firstChild as Text, 2, 2)

    expect(captureSelection(container)).toBeNull()

    document.body.removeChild(container)
  })

  test('returns null when the selected text is shorter than 4 characters', () => {
    const container = document.createElement('div')
    container.textContent = 'Some text.'
    document.body.appendChild(container)

    selectTextNode(container.firstChild as Text, 0, 3) // 'Som'

    expect(captureSelection(container)).toBeNull()

    document.body.removeChild(container)
  })

  test('returns null when the selection is only whitespace', () => {
    const container = document.createElement('div')
    container.textContent = 'Some    text.'
    document.body.appendChild(container)

    selectTextNode(container.firstChild as Text, 4, 8) // the run of spaces

    expect(captureSelection(container)).toBeNull()

    document.body.removeChild(container)
  })

  test('computes offsets into textContent across multiple child nodes', () => {
    const container = document.createElement('div')
    const bold = document.createElement('strong')
    bold.textContent = 'Event Loop'
    container.append('The ', bold, ' hands CPU work.')
    document.body.appendChild(container)

    selectTextNode(bold.firstChild as Text, 0, 10)

    expect(captureSelection(container)).toEqual({ text: 'Event Loop', range: { start: 4, end: 14 } })

    document.body.removeChild(container)
  })
})
