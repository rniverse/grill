import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { content, type TopicModule } from '@/services/content'
import { t } from '@/utils/i18n'
import { SearchIcon, ImportIcon, LogoIcon } from '@/utils/icons'
import { storage } from '@/services/storage'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { TopicRow } from '@/components/TopicRow/TopicRow'
import './LandingPage.css'

interface LoadedTopic {
  id: string
  name: string
  questionCount: number
  blurb?: string
}

export function LandingPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopic[]>([])
  const [totalReferences, setTotalReferences] = useState(0)
  const [importError, setImportError] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const results = await Promise.all(
        storage.list.sources().map(async (source) => {
          const [topicResult, referencesResult] = await Promise.all([
            content.load.topic(source),
            content.load.references(source),
          ])
          if (topicResult.status === 'error' || referencesResult.status === 'error') return null
          return { topicModule: topicResult.data, referenceCount: referencesResult.data.references.length }
        }),
      )
      const loaded = results.filter((result) => result !== null)

      if (cancelled) {
        return
      }

      const nextLoadedTopics: TopicModule[] = loaded.map(({ topicModule }) => topicModule)
      setLoadedTopics(
        nextLoadedTopics.map((topicModule) => ({
          id: topicModule.topic.id,
          name: topicModule.topic.name,
          questionCount: topicModule.questions.length,
        })),
      )
      setTotalReferences(loaded.reduce((sum, { referenceCount }) => sum + referenceCount, 0))
    }

    loadAllTopics()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      storage.personalLayer.import(text)
      setImportError(false)
    } catch {
      setImportError(true)
    }
  }

  const totalQuestions = loadedTopics.reduce((sum, topic) => sum + topic.questionCount, 0)
  const summaryText = t('landing.summary', {
    topics: loadedTopics.length,
    questions: totalQuestions,
    references: totalReferences,
  })

  return (
    <div className="landing-page">
      <IconRail />
      <div className="landing-page__content">
        <div className="landing-page__card">
          <div className="landing-page__header">
            <h1 className="landing-page__label">{t('landing.contents')}</h1>
            <span className="landing-page__summary">{summaryText}</span>
            <button type="button" className="landing-page__control">
              <SearchIcon size={15} />
              <span>{t('landing.search')}</span>
            </button>
            <button type="button" className="landing-page__control" onClick={() => importInputRef.current?.click()}>
              <ImportIcon size={15} />
              <span>{t('landing.import.label')}</span>
            </button>
          </div>
          <div className="landing-page__mobile-header">
            <MobileNav />
            <div className="landing-page__mobile-logo">
              <LogoIcon size={16} />
            </div>
            <h1 className="landing-page__mobile-title">{t('landing.contents')}</h1>
            <div className="landing-page__mobile-actions">
              <button
                type="button"
                className="landing-page__mobile-icon-button"
                aria-label={t('landing.import.label')}
                onClick={() => importInputRef.current?.click()}
              >
                <ImportIcon size={16} />
              </button>
              <button type="button" className="landing-page__mobile-icon-button" aria-label={t('landing.search')}>
                <SearchIcon size={16} />
              </button>
            </div>
          </div>
          <p className="landing-page__mobile-summary">{summaryText}</p>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={handleImportFile}
            aria-label={t('landing.import.label')}
          />
          {importError ? <p className="landing-page__import-error">{t('landing.import.error')}</p> : null}
          <div className="landing-page__rows">
            {loadedTopics.map((topic, index) => (
              <TopicRow
                key={topic.id}
                ordinal={String(index + 1).padStart(2, '0')}
                topicId={topic.id}
                name={topic.name}
                blurb={topic.blurb}
                questionCount={topic.questionCount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
