import { useState } from 'react'
import type { ContentSourceConfig, SourceValidation } from '@/config/content-sources'
import { content } from '@/services/content'
import { storage } from '@/services/storage'
import { generateId } from '@/utils/id'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import './PreferencesPage.css'

const CONFIRMATION_DURATION_MS = 2000

function formatCheckedAt(at: string): string {
  return t('preferences.source.validation.at', { time: new Date(at).toLocaleString() })
}

function SourceRow({ source, onValidated }: { source: ContentSourceConfig; onValidated: () => void }) {
  const [validating, setValidating] = useState(false)

  async function handleValidate() {
    setValidating(true)
    const at = new Date().toISOString()

    if (source.source.topic) {
      const result = await content.load.topic(source)
      storage.update.sourceValidation(
        source.id,
        'topic',
        result.status === 'ok' ? { status: 'success', at } : { status: 'failed', at, error: result.error },
      )
    }
    if (source.source.references) {
      const result = await content.load.references(source)
      storage.update.sourceValidation(
        source.id,
        'references',
        result.status === 'ok' ? { status: 'success', at } : { status: 'failed', at, error: result.error },
      )
    }

    setValidating(false)
    onValidated()
  }

  function renderValidation(validation: SourceValidation | undefined) {
    if (!validation) return null
    return (
      <p
        className={
          validation.status === 'success'
            ? 'preferences-page__source-status preferences-page__source-status--success'
            : 'preferences-page__source-status preferences-page__source-status--failed'
        }
      >
        {t(validation.status === 'success' ? 'preferences.source.validation.success' : 'preferences.source.validation.failed')}
        {validation.status === 'failed' && validation.error ? ` — ${validation.error.message}` : ''}
        {' · '}
        {formatCheckedAt(validation.at)}
      </p>
    )
  }

  return (
    <div className="preferences-page__source-row">
      <div className="preferences-page__source-header">
        <span className="preferences-page__source-name">{source.name}</span>
        <span className="preferences-page__source-id">{source.id}</span>
      </div>
      <div className="preferences-page__source-field">
        <span className="preferences-page__source-field-label">{t('preferences.source.topic.label')}</span>
        <span className="preferences-page__source-field-value">
          {source.source.topic ?? t('preferences.source.empty')}
        </span>
      </div>
      <div className="preferences-page__source-field">
        <span className="preferences-page__source-field-label">{t('preferences.source.references.label')}</span>
        <span className="preferences-page__source-field-value">
          {source.source.references ?? t('preferences.source.empty')}
        </span>
      </div>
      <button type="button" className="preferences-page__source-validate" onClick={handleValidate} disabled={validating}>
        {t('preferences.source.validate')}
      </button>
      {renderValidation(source.validation?.topic)}
      {renderValidation(source.validation?.references)}
    </div>
  )
}

export function PreferencesPage() {
  const [copied, setCopied] = useState(false)
  const [, bumpVersion] = useState(0)
  const sources = storage.list.sources()

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

          <section className="preferences-page__section">
            <h2 className="preferences-page__section-title">{t('page.preferences.section.sources')}</h2>
            <div className="preferences-page__sources">
              {sources.map((source) => (
                <SourceRow key={source.id} source={source} onValidated={() => bumpVersion((version) => version + 1)} />
              ))}
            </div>
          </section>

          <section className="preferences-page__section">
            <h2 className="preferences-page__section-title">{t('page.preferences.section.developer')}</h2>
            <button type="button" className="preferences-page__generate" onClick={handleGenerate}>
              {t('preferences.generate.label')}
            </button>
            {copied ? <p className="preferences-page__confirmation">{t('preferences.generate.copied')}</p> : null}
          </section>
        </div>
      </div>
    </div>
  )
}
