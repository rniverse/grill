export const PersonalRailTab = {
  Questions: 'questions',
  Bookmarks: 'bookmarks',
  Notes: 'notes',
} as const

export type PersonalRailTab = (typeof PersonalRailTab)[keyof typeof PersonalRailTab]
