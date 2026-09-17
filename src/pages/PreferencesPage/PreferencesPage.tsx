import { useState, type FormEvent } from 'react'
import type { ContentSourceConfig, SourceValidation } from '@/config/content-sources'
import { contentCache } from '@/services/content-cache'
import { storage } from '@/services/storage'
import { generateId } from '@/utils/id'
import { t } from '@/utils/i18n'
import { EditIcon, ReloadIcon, RemoveIcon } from '@/utils/icons'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PreferencesSection } from './preferences-section.enum'
import './PreferencesPage.css'

const CONFIRMATION_DURATION_MS = 2000

function formatUpdatedAt(at: string): string {
  return t('preferences.source.updated.at', { time: new Date(at).toLocaleString() })
}

function SourceUrlCell({ url, validation }: { url: string; validation: SourceValidation | undefined }) {
  return (
    <div className="preferences-page__source-cell">
      <span>{url}</span>
      {validation ? <span className="preferences-page__source-updated">{formatUpdatedAt(validation.at)}</span> : null}
    </div>
  )
}

function ValidationStatus({ kind, validation }: { kind: 'topic' | 'references'; validation: SourceValidation | undefined }) {
  if (!validation) return null
  const kindLabel = t(kind === 'topic' ? 'preferences.source.kind.topic' : 'preferences.source.kind.references')
  const time = new Date(validation.at).toLocaleString()
  return (
    <p
      className={
        validation.status === 'success'
          ? 'preferences-page__source-status preferences-page__source-status--success'
          : 'preferences-page__source-status preferences-page__source-status--failed'
      }
    >
      {validation.status === 'success'
        ? t('preferences.source.status.checked', { kind: kindLabel, time })
        : t('preferences.source.status.failed', { kind: kindLabel, error: validation.error?.message ?? '' })}
    </p>
  )
}

interface SourceFormValue {
  id: string
  name: string
  topic: string
  references: string
}

function SourceDialog({
  mode,
  source,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  source?: ContentSourceConfig
  onClose: () => void
  onSaved: () => void
}) {
  const [value, setValue] = useState<SourceFormValue>({
    id: source?.id ?? '',
    name: source?.name ?? '',
    topic: source?.source.topic ?? '',
    references: source?.source.references ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (mode === 'add' && value.id.trim() === '') {
      setError(t('preferences.source.id.required'))
      return
    }

    const patch = {
      name: value.name,
      source: {
        topic: value.topic.trim() === '' ? undefined : value.topic,
        references: value.references.trim() === '' ? undefined : value.references,
      },
    }

    if (mode === 'add') {
      try {
        storage.create.source({ id: value.id, ...patch })
      } catch {
        setError(t('preferences.source.id.duplicate'))
        return
      }
    } else if (source) {
      storage.update.source(source.id, patch)
    }

    onSaved()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="preferences-page__dialog">
        <DialogTitle className="preferences-page__dialog-title">
          {t(mode === 'add' ? 'preferences.source.dialog.add.title' : 'preferences.source.dialog.edit.title')}
        </DialogTitle>
        <form className="preferences-page__dialog-form" onSubmit={handleSubmit}>
          <label className="preferences-page__dialog-field" htmlFor="preferences-source-id">
            {t('preferences.source.field.id')}
            <input
              id="preferences-source-id"
              type="text"
              value={value.id}
              disabled={mode === 'edit'}
              onChange={(event) => setValue((current) => ({ ...current, id: event.target.value }))}
            />
          </label>
          <label className="preferences-page__dialog-field" htmlFor="preferences-source-name">
            {t('preferences.source.field.name')}
            <input
              id="preferences-source-name"
              type="text"
              value={value.name}
              onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="preferences-page__dialog-field" htmlFor="preferences-source-topic">
            {t('preferences.source.topic.label')}
            <input
              id="preferences-source-topic"
              type="text"
              value={value.topic}
              onChange={(event) => setValue((current) => ({ ...current, topic: event.target.value }))}
            />
          </label>
          <label className="preferences-page__dialog-field" htmlFor="preferences-source-references">
            {t('preferences.source.references.label')}
            <input
              id="preferences-source-references"
              type="text"
              value={value.references}
              onChange={(event) => setValue((current) => ({ ...current, references: event.target.value }))}
            />
          </label>
          {error ? <p className="preferences-page__dialog-error">{error}</p> : null}
          <div className="preferences-page__dialog-actions">
            <button type="button" className="preferences-page__dialog-cancel" onClick={onClose}>
              {t('preferences.source.cancel')}
            </button>
            <button type="submit" className="preferences-page__dialog-save">
              {t('preferences.source.save')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SourcesPanel() {
  const [, bumpVersion] = useState(0)
  const [dialog, setDialog] = useState<{ mode: 'add' | 'edit'; source?: ContentSourceConfig } | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const sources = storage.list.sources()
  const refresh = () => bumpVersion((version) => version + 1)

  async function handleValidate(source: ContentSourceConfig) {
    // contentCache.resolve.* itself records the checked/fetched timestamp
    // (see content-cache.ts) — nothing to write here, just force the fetch
    // and re-read storage once it settles.
    setValidatingId(source.id)
    try {
      if (source.source.topic) {
        await contentCache.resolve.topic(source, { force: true })
      }
      if (source.source.references) {
        await contentCache.resolve.references(source, { force: true })
      }
    } finally {
      setValidatingId(null)
      refresh()
    }
  }

  return (
    <div className="preferences-page__panel">
      <table className="preferences-page__table">
        <thead>
          <tr>
            <th className="preferences-page__table-col-fixed">{t('preferences.source.field.id')}</th>
            <th className="preferences-page__table-col-fixed">{t('preferences.source.field.name')}</th>
            <th>{t('preferences.source.topic.label')}</th>
            <th>{t('preferences.source.references.label')}</th>
            <th>{t('preferences.source.table.status')}</th>
            <th className="preferences-page__table-col-fixed">{t('preferences.source.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id}>
              <td className="preferences-page__table-mono">{source.id}</td>
              <td>{source.name}</td>
              <td className="preferences-page__table-mono">
                {source.source.topic ? (
                  <SourceUrlCell url={source.source.topic} validation={source.validation?.topic} />
                ) : (
                  t('preferences.source.empty')
                )}
              </td>
              <td className="preferences-page__table-mono">
                {source.source.references ? (
                  <SourceUrlCell url={source.source.references} validation={source.validation?.references} />
                ) : (
                  t('preferences.source.empty')
                )}
              </td>
              <td>
                <ValidationStatus kind="topic" validation={source.validation?.topic} />
                <ValidationStatus kind="references" validation={source.validation?.references} />
              </td>
              <td className="preferences-page__table-actions">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="preferences-page__source-validate"
                        aria-label={t('preferences.source.validate')}
                        onClick={() => handleValidate(source)}
                        disabled={validatingId === source.id}
                      />
                    }
                  >
                    <ReloadIcon size={14} className={validatingId === source.id ? 'icon-spin' : undefined} />
                  </TooltipTrigger>
                  <TooltipContent>{t('preferences.source.validate')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="preferences-page__table-edit"
                        aria-label={t('preferences.source.edit')}
                        onClick={() => setDialog({ mode: 'edit', source })}
                      />
                    }
                  >
                    <EditIcon size={14} />
                  </TooltipTrigger>
                  <TooltipContent>{t('preferences.source.edit')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="preferences-page__table-remove"
                        aria-label={t('preferences.source.delete')}
                        onClick={() => {
                          storage.delete.source(source.id)
                          refresh()
                        }}
                      />
                    }
                  >
                    <RemoveIcon size={14} />
                  </TooltipTrigger>
                  <TooltipContent>{t('preferences.source.delete')}</TooltipContent>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="preferences-page__add-source" onClick={() => setDialog({ mode: 'add' })}>
        {t('preferences.source.add')}
      </button>
      {dialog ? (
        <SourceDialog
          mode={dialog.mode}
          source={dialog.source}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  )
}

function DeveloperPanel() {
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
    <div className="preferences-page__panel">
      <button type="button" className="preferences-page__generate" onClick={handleGenerate}>
        {t('preferences.generate.label')}
      </button>
      {copied ? <p className="preferences-page__confirmation">{t('preferences.generate.copied')}</p> : null}
    </div>
  )
}

export function PreferencesPage() {
  const [activeSection, setActiveSection] = useState<PreferencesSection>(PreferencesSection.Sources)

  return (
    <div className="preferences-page">
      <IconRail />
      <div className="preferences-page__content">
        <div className="preferences-page__card">
          <div className="preferences-page__mobile-header">
            <MobileNav />
          </div>
          <h1 className="preferences-page__title">{t('page.preferences.title')}</h1>

          <div className="preferences-page__body">
            <nav className="preferences-page__nav">
              <button
                type="button"
                className="preferences-page__nav-item"
                aria-current={activeSection === PreferencesSection.Sources}
                onClick={() => setActiveSection(PreferencesSection.Sources)}
              >
                {t('page.preferences.section.sources')}
              </button>
              <button
                type="button"
                className="preferences-page__nav-item"
                aria-current={activeSection === PreferencesSection.Developer}
                onClick={() => setActiveSection(PreferencesSection.Developer)}
              >
                {t('page.preferences.section.developer')}
              </button>
            </nav>
            {activeSection === PreferencesSection.Sources ? <SourcesPanel /> : <DeveloperPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
