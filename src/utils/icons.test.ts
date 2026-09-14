import { describe, expect, test } from 'bun:test'
import * as icons from './icons'

describe('icons', () => {
  test('exports every icon P1 needs', () => {
    const expectedNames = [
      'LogoIcon',
      'TopicsIcon',
      'ReferencesIcon',
      'BookmarksIcon',
      'QuestionsIcon',
      'NotesIcon',
      'ExportIcon',
      'SearchIcon',
      'ImportIcon',
      'AskIcon',
      'BookmarkedIcon',
    ]

    for (const name of expectedNames) {
      expect(icons[name as keyof typeof icons]).toBeDefined()
    }
  })
})
