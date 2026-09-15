import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { PendingQuestion } from '@/types/personal.types'
import { listPendingQuestions } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import './QuestionsPage.css'

interface LoadedTopicSummary {
  id: string
  name: string
}

export function QuestionsPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const summaries = await Promise.all(
        topicsConfig.map(async (entry) => {
          const topicModule = await entry.load()
          return { id: topicModule.topic.id, name: topicModule.topic.name }
        }),
      )
      if (!cancelled) setLoadedTopics(summaries)
    }

    loadAllTopics()
    return () => {
      cancelled = true
    }
  }, [])

  function topicByName(name: string): LoadedTopicSummary | undefined {
    return loadedTopics.find((topic) => topic.name === name)
  }

  const pendingQuestions: PendingQuestion[] = listPendingQuestions()

  return (
    <div className="questions-page">
      <IconRail />
      <div className="questions-page__content">
        <div className="questions-page__card">
          <h1 className="questions-page__title">{t('questions.title')}</h1>
          <div className="questions-page__items">
            {pendingQuestions.length === 0 ? (
              <p className="questions-page__empty">{t('personal.railQuestionsEmpty')}</p>
            ) : (
              pendingQuestions.map((pending) => {
                const topic = topicByName(pending.topic.name)
                return topic ? (
                  <Link key={pending.id} to={`/topics/${topic.id}`} className="questions-page__item">
                    <span className="questions-page__item-label">{pending.ask}</span>
                  </Link>
                ) : (
                  <div key={pending.id} className="questions-page__item questions-page__item--static">
                    <span className="questions-page__item-label">{pending.ask}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
