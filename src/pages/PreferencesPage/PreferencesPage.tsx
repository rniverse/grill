import { useState } from 'react'
import { generateId } from '@/utils/id'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import './PreferencesPage.css'

const CONFIRMATION_DURATION_MS = 2000

export function PreferencesPage() {
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    const id = generateId()
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), CONFIRMATION_DURATION_MS)
    } catch {
      // Clipboard write can fail (permissions, non-secure context) — nothing
      // to show if it does.
    }
  }

  return (
    <div className="preferences-page">
      <IconRail />
      <div className="preferences-page__content">
        <div className="preferences-page__card">
          <div className="preferences-page__mobile-header">
            <MobileNav />
          </div>
          <h1 className="preferences-page__title">{t('page.preferences.title')}</h1>
          <div className="preferences-page__section">
            <button type="button" className="preferences-page__generate" onClick={handleGenerate}>
              {t('preferences.generate.label')}
            </button>
            {copied ? <p className="preferences-page__confirmation">{t('preferences.generate.copied')}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
