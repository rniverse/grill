import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { Question, Reference, Topic } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { RailSection } from '@/components/IconRail/rail-section.enum'
import { FilterChips } from '@/components/FilterChips/FilterChips'
import { QuestionCard } from '@/components/QuestionCard/QuestionCard'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import './TopicPage.css'

function collectTags(questions: Question[]): string[] {
  const filterAll = t('topic.filterAll')
  const tags: string[] = [filterAll]
  const seen = new Set<string>([filterAll])

  for (const question of questions) {
    for (const tag of question.tags ?? []) {
      if (!seen.has(tag)) {
        seen.add(tag)
        tags.push(tag)
      }
    }
  }

  return tags
}

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [references, setReferences] = useState<Reference[]>([])
  const [notFound, setNotFound] = useState(false)
  const [activeFilter, setActiveFilter] = useState(() => t('topic.filterAll'))
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)
  const [openReference, setOpenReference] = useState<Reference | null>(null)

  useEffect(() => {
    let cancelled = false
    setNotFound(false)
    setActiveFilter(t('topic.filterAll'))
    setOpenQuestionId(null)

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
      setQuestions(topicModule.questions)
      setReferences(referencesModule.references)
    }

    loadTopic()

    return () => {
      cancelled = true
    }
  }, [topicId])

  if (notFound) {
    return (
      <div className="topic-page">
        <IconRail activeSection={RailSection.Topics} />
        <div className="topic-page__not-found">
          <p>{t('topic.notFound')}</p>
          <Link to="/">{t('topic.backToTopics')}</Link>
        </div>
      </div>
    )
  }

  const visibleQuestions = questions.filter(
    (question) => activeFilter === t('topic.filterAll') || (question.tags ?? []).includes(activeFilter),
  )

  return (
    <div className="topic-page">
      <IconRail activeSection={RailSection.Topics} />
      <main className="topic-page__main">
        {topic ? (
          <div className="topic-page__content">
            <div className="topic-page__header">
              <div className="topic-page__title-row">
                <h1 className="topic-page__title">{topic.name}</h1>
              </div>
            </div>
            <FilterChips tags={collectTags(questions)} active={activeFilter} onSelect={setActiveFilter} />
            <div className="topic-page__cards">
              {visibleQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  ordinal={String(index + 1).padStart(2, '0')}
                  question={question}
                  references={references}
                  open={openQuestionId === question.id}
                  onToggle={() => setOpenQuestionId(openQuestionId === question.id ? null : question.id)}
                  onReferenceSelect={setOpenReference}
                />
              ))}
            </div>
          </div>
        ) : null}
      </main>
      <ReferenceModal reference={openReference} onClose={() => setOpenReference(null)} />
    </div>
  )
}
