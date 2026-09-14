import { describe, expect, test } from 'bun:test'
import { t } from './i18n'

describe('t', () => {
  test('resolves a plain key', () => {
    expect(t('landing.contents')).toBe('Contents')
  })

  test('interpolates placeholders from vars', () => {
    const result = t('landing.summary', { topics: 1, questions: 30, references: 5 })
    expect(result).toBe('1 topics · 30 questions · 5 references')
  })
})
