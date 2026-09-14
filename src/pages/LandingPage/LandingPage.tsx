import { useEffect, useState } from 'react'
import { topicsConfig, type TopicModule } from '@/topics.config'
import { t } from '@/utils/i18n'
import { SearchIcon, ImportIcon } from '@/utils/icons'
import { IconRail } from '@/components/IconRail/IconRail'
import { RailSection } from '@/components/IconRail/rail-section.enum'
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

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const modules: TopicModule[] = []
      let referenceCount = 0
      for (const entry of topicsConfig) {
        const [topicModule, referencesModule] = await Promise.all([entry.load(), entry.loadReferences()])
        modules.push(topicModule)
        referenceCount += referencesModule.references.length
      }

      if (cancelled) {
        return
      }

      const nextLoadedTopics = modules.map((topicModule) => ({
        id: topicModule.topic.id,
        name: topicModule.topic.name,
        questionCount: topicModule.questions.length,
      }))
      setLoadedTopics(nextLoadedTopics)
      setTotalReferences(referenceCount)
    }

    loadAllTopics()

    return () => {
      cancelled = true
    }
  }, [])

  const totalQuestions = loadedTopics.reduce((sum, topic) => sum + topic.questionCount, 0)

  return (
    <div className="landing-page">
      <IconRail activeSection={RailSection.Topics} />
      <div className="landing-page__content">
        <div className="landing-page__card">
          <div className="landing-page__header">
            <span className="landing-page__label">{t('landing.contents')}</span>
            <span className="landing-page__summary">
              {t('landing.summary', {
                topics: loadedTopics.length,
                questions: totalQuestions,
                references: totalReferences,
              })}
            </span>
            <button type="button" className="landing-page__control">
              <SearchIcon size={15} />
              <span>{t('landing.search')}</span>
            </button>
            <button type="button" className="landing-page__control">
              <ImportIcon size={15} />
              <span>{t('landing.import')}</span>
            </button>
          </div>
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
