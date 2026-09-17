// Which right-hand panel is showing in the left-nav/right-panel Preferences
// layout — only one section renders at a time.
export const PreferencesSection = {
  Sources: 'sources',
  Developer: 'developer',
} as const

export type PreferencesSection = (typeof PreferencesSection)[keyof typeof PreferencesSection]
