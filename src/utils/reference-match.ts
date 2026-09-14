import type { Reference } from '@/types/topic.types'

export interface ReferenceMatch {
  start: number
  end: number
  reference: Reference
}

const WORD_CHAR = /[A-Za-z0-9_]/

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && WORD_CHAR.test(char)
}

export function findReferenceMatches(text: string, references: Reference[]): ReferenceMatch[] {
  const lowerText = text.toLowerCase()
  const takenPositions = new Array<boolean>(text.length).fill(false)
  const referencesByLength = [...references].sort((a, b) => b.term.length - a.term.length)

  const matches: ReferenceMatch[] = []

  for (const reference of referencesByLength) {
    const lowerTerm = reference.term.toLowerCase()
    let searchFrom = 0

    while (searchFrom <= lowerText.length) {
      const start = lowerText.indexOf(lowerTerm, searchFrom)
      if (start === -1) {
        break
      }
      const end = start + lowerTerm.length
      searchFrom = end

      const hasWordBoundary = !isWordChar(lowerText[start - 1]) && !isWordChar(lowerText[end])
      if (!hasWordBoundary) {
        continue
      }

      let overlapsExistingMatch = false
      for (let position = start; position < end; position++) {
        if (takenPositions[position]) {
          overlapsExistingMatch = true
          break
        }
      }
      if (overlapsExistingMatch) {
        continue
      }

      for (let position = start; position < end; position++) {
        takenPositions[position] = true
      }
      matches.push({ start, end, reference })
    }
  }

  matches.sort((a, b) => a.start - b.start)
  return matches
}
