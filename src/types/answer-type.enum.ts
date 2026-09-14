export const AnswerType = {
  Text: 'text',
  MdText: 'md-text',
} as const

export type AnswerType = (typeof AnswerType)[keyof typeof AnswerType]
