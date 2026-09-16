import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { content } from '@/services/content'
import { storage } from '@/services/storage'
import type { FileMeta, Reference, Topic } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { TopicRow } from '@/components/TopicRow/TopicRow'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import './ReferencesPage.css'

interface LoadedTopic {
  id: string
  name: string
  referenceCount: number
}

export function ReferencesPage() {
  const { topicId } = useParams<{ topicId: string }>()
  return topicId ? <TopicReferences topicId={topicId} /> : <ReferencesPicker />
}

function ReferencesPicker() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopic[]>([])

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
          return {
            id: topicResult.data.topic.id,
            name: topicResult.data.topic.name,
            referenceCount: referencesResult.data.references.length,
          }
        }),
      )

      if (!cancelled) {
        setLoadedTopics(results.filter((topic) => topic !== null))
      }
    }

    loadAllTopics()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="references-page">
      <IconRail />
      <div className="references-page__mobile-header">
        <MobileNav />
      </div>
      <div className="references-page__content">
        <div className="references-page__card">
          <h1 className="references-page__label">{t('page.references.title')}</h1>
          <div className="references-page__rows">
            {loadedTopics.map((topic, index) => (
              <TopicRow
                key={topic.id}
                ordinal={String(index + 1).padStart(2, '0')}
                topicId={topic.id}
                name={topic.name}
                questionCount={topic.referenceCount}
                to={`/references/${topic.id}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TopicReferences({ topicId }: { topicId: string }) {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [references, setReferences] = useState<Reference[]>([])
  const [notFound, setNotFound] = useState(false)
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  // Bumped whenever a personal-layer mutation (ask/bookmark) happens inside
  // the reference modal, so pending-question highlights there re-read
  // storage and reflect it. Never rendered itself.
  const [, bumpPersonalVersion] = useState(0)
  const onPersonalLayerChange = () => bumpPersonalVersion((version) => version + 1)

  useEffect(() => {
    let cancelled = false
    setNotFound(false)
    setTopic(null)
    setMeta(null)
    setReferences([])
    setOpenReference(null)

    const source = storage.list.sources().find((row) => row.id === topicId)
    if (!source) {
      setNotFound(true)
      return
    }

    async function loadTopic() {
      // source is narrowed non-null above, but that narrowing doesn't reach
      // into this nested function's closure — TS can't see across it.
      const [topicResult, referencesResult] = await Promise.all([
        // biome-ignore lint/style/noNonNullAssertion: narrowed above; see comment
        content.load.topic(source!),
        // biome-ignore lint/style/noNonNullAssertion: narrowed above; see comment
        content.load.references(source!),
      ])
      if (cancelled) {
        return
      }
      if (topicResult.status === 'error' || referencesResult.status === 'error') {
        setNotFound(true)
        return
      }
      const topicModule = topicResult.data
      const referencesModule = referencesResult.data
      setTopic(topicModule.topic)
      setMeta(topicModule.meta)
      setReferences(referencesModule.references)
    }

    loadTopic()

    return () => {
      cancelled = true
    }
  }, [topicId])

  if (notFound) {
    return (
      <div className="references-page">
        <IconRail />
        <div className="references-page__mobile-header">
          <MobileNav />
        </div>
        <div className="references-page__not-found">
          <p>{t('error.notfound.references')}</p>
          <Link to="/references">{t('backto.references')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="references-page">
      <IconRail />
      <div className="references-page__mobile-header">
        <MobileNav />
      </div>
      <div className="references-page__content">
        {topic ? (
          <div className="references-page__card">
            <div className="references-page__header">
              <h1 className="references-page__title">{topic.name}</h1>
              <span className="references-page__count">
                {t('references.term.count', { count: references.length })}
              </span>
            </div>
            <div className="references-page__chips">
              {references.map((reference) => (
                <button
                  key={reference.id}
                  type="button"
                  className="references-page__chip"
                  onClick={() => setOpenReference(reference)}
                >
                  {reference.term}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {topic && meta ? (
        <ReferenceModal
          reference={openReference}
          topic={{ name: topic.name, version: meta.version }}
          onClose={() => setOpenReference(null)}
          onPersonalLayerChange={onPersonalLayerChange}
        />
      ) : null}
    </div>
  )
}
