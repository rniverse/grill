import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { content } from '@/services/content'
import type { FileMeta, Question, Reference } from '@/types/topic.types'
import type { LocalTargetRef, PendingQuestion } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { CollapsibleSection } from '@/components/CollapsibleSection/CollapsibleSection'
import { TopicBadge } from '@/components/TopicBadge/TopicBadge'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import { RemoveIcon } from '@/utils/icons'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import './QuestionsPage.css'

interface LoadedTopicSummary {
  id: string
  name: string
  meta: FileMeta
  questions: Question[]
  references: Reference[]
}

// The term/question text this pending question was asked against — shown
// in the dialog so it's clear what the quote below is from.
function targetLabel(target: LocalTargetRef['target'], topic: LoadedTopicSummary | undefined): string {
  if (!topic) return target.id
  if (target.kind === 'question') {
    return topic.questions.find((question) => question.id === target.id)?.question ?? target.id
  }
  return topic.references.find((reference) => reference.id === target.id)?.term ?? target.id
}

function QuestionItems({
  pendingQuestions,
  emptyText,
  onSelect,
}: {
  pendingQuestions: PendingQuestion[]
  emptyText: string
  onSelect: (pending: PendingQuestion) => void
}) {
  if (pendingQuestions.length === 0) {
    return <p className="questions-page__empty">{emptyText}</p>
  }

  return (
    <>
      {pendingQuestions.map((pending) => (
        <button
          key={pending.id}
          type="button"
          className="questions-page__item"
          onClick={() => onSelect(pending)}
        >
          <TopicBadge>{pending.topic.name}</TopicBadge>
          <span className="questions-page__item-label">{pending.ask}</span>
        </button>
      ))}
    </>
  )
}

export function QuestionsPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [openPending, setOpenPending] = useState<PendingQuestion | null>(null)
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  const [openReferenceTopic, setOpenReferenceTopic] = useState<LoadedTopicSummary | null>(null)
  // Bumped whenever a delete or the reference modal's bookmark button
  // changes something, so re-reading storage below picks up the change.
  const [, bumpPersonalVersion] = useState(0)

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
            meta: topicResult.data.meta,
            questions: topicResult.data.questions,
            references: referencesResult.data.references,
          }
        }),
      )
      const summaries = results.filter((summary) => summary !== null)
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

  function removePending(pending: PendingQuestion) {
    storage.delete.question(pending.id)
    bumpPersonalVersion((version) => version + 1)
    setOpenPending(null)
  }

  function goToPendingReference() {
    if (!openPending) return
    const topic = topicByName(openPending.topic.name)
    if (!topic) return

    const reference = topic.references.find((candidate) => candidate.id === openPending.target.id)
    if (reference) {
      setOpenReference(reference)
      setOpenReferenceTopic(topic)
    }
    setOpenPending(null)
  }

  const pendingQuestions: PendingQuestion[] = storage.list.personal.questions()
  const onQuestionTarget = pendingQuestions.filter((pending) => pending.target.kind === 'question')
  const onReferenceTarget = pendingQuestions.filter((pending) => pending.target.kind === 'reference')
  const openTopic = openPending ? topicByName(openPending.topic.name) : undefined

  return (
    <div className="questions-page">
      <IconRail />
      <div className="questions-page__content">
        <div className="questions-page__card">
          <div className="questions-page__mobile-header">
            <MobileNav />
          </div>
          <h1 className="questions-page__title">{t('page.questions.title')}</h1>
          <div className="questions-page__sections">
            <CollapsibleSection title={t('personal.rail.tab.questions')}>
              <QuestionItems
                pendingQuestions={onQuestionTarget}
                emptyText={t('personal.rail.empty.questions')}
                onSelect={setOpenPending}
              />
            </CollapsibleSection>
            <CollapsibleSection title={t('nav.references')}>
              <QuestionItems
                pendingQuestions={onReferenceTarget}
                emptyText={t('references.empty.questions')}
                onSelect={setOpenPending}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>
      <Dialog open={openPending !== null} onOpenChange={(open) => !open && setOpenPending(null)}>
        <DialogContent className="questions-page__dialog" showCloseButton={false}>
          {openPending ? (
            <>
              <div className="questions-page__dialog-header">
                <TopicBadge>{openPending.topic.name}</TopicBadge>
                <DialogClose className="questions-page__dialog-close" aria-label={t('reference.close')}>
                  ×
                </DialogClose>
              </div>
              <p className="questions-page__dialog-target">{targetLabel(openPending.target, openTopic)}</p>
              <p className="questions-page__dialog-quote">{openPending.selection.text}</p>
              <DialogTitle className="questions-page__dialog-ask">{openPending.ask}</DialogTitle>
              <div className="questions-page__dialog-actions">
                {openPending.target.kind === 'question' && openTopic ? (
                  <Link
                    to={`/topics/${openTopic.id}?question=${openPending.target.id}`}
                    className="questions-page__dialog-link"
                    onClick={() => setOpenPending(null)}
                  >
                    {t('personal.goto.question')}
                  </Link>
                ) : null}
                {openPending.target.kind === 'reference' ? (
                  <button type="button" className="questions-page__dialog-link" onClick={goToPendingReference}>
                    {t('personal.goto.reference')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="questions-page__dialog-remove"
                  aria-label={t('personal.rail.remove')}
                  onClick={() => removePending(openPending)}
                >
                  <RemoveIcon size={16} />
                </button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {openReferenceTopic ? (
        <ReferenceModal
          reference={openReference}
          topic={{ name: openReferenceTopic.name, version: openReferenceTopic.meta.version }}
          onClose={() => {
            setOpenReference(null)
            setOpenReferenceTopic(null)
          }}
          onPersonalLayerChange={() => bumpPersonalVersion((version) => version + 1)}
        />
      ) : null}
    </div>
  )
}
