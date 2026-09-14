export const TextType = {
  Simple: 'simple',
  MarkdownText: 'markdown.text',
  MarkdownRef: 'markdown.ref',
} as const

export type TextType = (typeof TextType)[keyof typeof TextType]
