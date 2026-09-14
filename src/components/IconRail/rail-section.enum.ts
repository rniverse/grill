export const RailSection = {
  Topics: 'topics',
  References: 'references',
  Bookmarks: 'bookmarks',
  Questions: 'questions',
  Notes: 'notes',
} as const

export type RailSection = (typeof RailSection)[keyof typeof RailSection]
