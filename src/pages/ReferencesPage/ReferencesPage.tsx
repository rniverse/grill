import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { Reference, Topic } from '@/types/topic.types'
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
      const nextLoadedTopics: LoadedTopic[] = []
      for (const entry of topicsConfig) {
        const [topicModule, referencesModule] = await Promise.all([entry.load(), entry.loadReferences()])
        nextLoadedTopics.push({
          id: topicModule.topic.id,
          name: topicModule.topic.name,
          referenceCount: referencesModule.references.length,
        })
      }

      if (!cancelled) {
        setLoadedTopics(nextLoadedTopics)
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
  const [references, setReferences] = useState<Reference[]>([])
  const [notFound, setNotFound] = useState(false)
  const [openReference, setOpenReference] = useState<Reference | null>(null)

  useEffect(() => {
    let cancelled = false
    setNotFound(false)
    setTopic(null)
    setReferences([])
    setOpenReference(null)

    const entry = topicsConfig.find((config) => config.id === topicId)
    if (!entry) {
      setNotFound(true)
      return
    }

    async function loadTopic() {
      const [topicModule, referencesModule] = await Promise.all([entry!.load(), entry!.loadReferences()])
      if (cancelled) {
        return
      }
      setTopic(topicModule.topic)
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
      <ReferenceModal reference={openReference} onClose={() => setOpenReference(null)} />
    </div>
  )
}
