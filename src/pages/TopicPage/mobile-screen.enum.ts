// Mobile-only content swap for TopicPage's main pane — tapping the References
// icon in the mobile header replaces the question list with a flat reference
// list; tapping again (or the icon again) returns to the question list. Never
// reached at desktop widths (the icon that drives it is CSS-hidden there).
export const MobileScreen = {
  Questions: 'questions',
  References: 'references',
} as const

export type MobileScreen = (typeof MobileScreen)[keyof typeof MobileScreen]
