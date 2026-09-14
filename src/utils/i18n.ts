import en from '@/translate/en.json'

export type TranslationKey = keyof typeof en

type TranslationVars = Record<string, string | number>

export function t(key: TranslationKey, vars?: TranslationVars): string {
  const template = en[key]

  if (!vars) {
    return template
  }

  let result = template
  for (const [name, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${name}}}`, String(value))
  }
  return result
}
