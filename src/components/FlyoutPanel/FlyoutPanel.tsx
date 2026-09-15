import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { Question, Reference } from '@/types/topic.types'
import type { Bookmark, LocalTargetRef, PendingQuestion, PersonalNote } from '@/types/personal.types'
import { listBookmarks, listPendingQuestions, listPersonalNotes } from '@/services/storage'
import { t } from '@/utils/i18n'
import { CollapsePanelIcon } from '@/utils/icons'
import { RailSection } from '@/components/IconRail/rail-section.enum'
import './FlyoutPanel.css'

const NOTE_PREVIEW_LENGTH = 80

const sectionTitle: Record<RailSection, string> = {
  [RailSection.Topics]: t('nav.topics'),
  [RailSection.References]: t('nav.references'),
  [RailSection.Bookmarks]: t('nav.bookmarks'),
  [RailSection.Questions]: t('nav.myQuestions'),
  [RailSection.Notes]: t('nav.myNotes'),
}

interface LoadedTopicSummary {
  id: string
  name: string
  questionCount: number
  questions: Question[]
  references: Reference[]
}

export interface FlyoutPanelProps {
  section: RailSection
  topicId?: string
  onClose: () => void
}

// Bookmarks/pending questions/notes are cross-topic (P4 spec — "everything,
// everywhere", unlike PersonalRail's topic-scoped view), so resolving a
// bookmark's label needs the topic it was made in, looked up by name.
function resolveTargetLabel(target: LocalTargetRef['target'], topic: LoadedTopicSummary | undefined): string {
  if (!topic) return target.id
  if (target.kind === 'question') {
    return topic.questions.find((question) => question.id === target.id)?.question ?? target.id
  }
  return topic.references.find((reference) => reference.id === target.id)?.term ?? target.id
}

function notePreview(text: string): string {
  return text.length > NOTE_PREVIEW_LENGTH ? `${text.slice(0, NOTE_PREVIEW_LENGTH)}…` : text
}

export function FlyoutPanel({ section, topicId, onClose }: FlyoutPanelProps) {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const summaries = await Promise.all(
        topicsConfig.map(async (entry) => {
          const [topicModule, referencesModule] = await Promise.all([entry.load(), entry.loadReferences()])
          return {
            id: topicModule.topic.id,
            name: topicModule.topic.name,
            questionCount: topicModule.questions.length,
            questions: topicModule.questions,
            references: referencesModule.references,
          }
        }),
      )
      if (!cancelled) setLoadedTopics(summaries)
    }

    loadAllTopics()
    return () => {
      cancelled = true
    }
  }, [])

  // Below --bp-nav-panel this becomes a scrim-backed floating overlay, same
  // as MobileNav's drawer — Escape should close it there too. Harmless to
  // run unconditionally above that breakpoint too, where it's an inline
  // (non-overlay) panel.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function topicByName(name: string): LoadedTopicSummary | undefined {
    return loadedTopics.find((topic) => topic.name === name)
  }

  const bookmarks: Bookmark[] = listBookmarks()
  const pendingQuestions: PendingQuestion[] = listPendingQuestions()
  const notes: PersonalNote[] = listPersonalNotes()

  return (
    <>
      <div className="flyout-panel__scrim" onClick={onClose} />
      <div className="flyout-panel">
        <div className="flyout-panel__header">
          <span className="flyout-panel__title">{sectionTitle[section]}</span>
          <button type="button" className="flyout-panel__close" aria-label={t('nav.panelClose')} onClick={onClose}>
            <CollapsePanelIcon size={15} />
          </button>
        </div>

        <div className="flyout-panel__items">
          {section === RailSection.Topics
            ? topicsConfig.map((entry) => {
                const summary = loadedTopics.find((topic) => topic.id === entry.id)
                return (
                  <Link
                    key={entry.id}
                    to={`/topics/${entry.id}`}
                    className="flyout-panel__item"
                    aria-current={entry.id === topicId ? 'true' : undefined}
                    onClick={onClose}
                  >
                    <span className="flyout-panel__item-label">{entry.name}</span>
                    <span className="flyout-panel__item-count">{summary ? summary.questionCount : ''}</span>
                  </Link>
                )
              })
            : null}

          {section === RailSection.References ? (
            (() => {
              const topic = topicId ? loadedTopics.find((candidate) => candidate.id === topicId) : undefined
              if (!topicId || !topic) {
                return <p className="flyout-panel__empty">{t('nav.referencesPrompt')}</p>
              }
              if (topic.references.length === 0) {
                return <p className="flyout-panel__empty">{t('nav.referencesEmpty')}</p>
              }
              return topic.references.map((reference) => (
                <div key={reference.id} className="flyout-panel__item flyout-panel__item--static">
                  <span className="flyout-panel__item-label">{reference.term}</span>
                </div>
              ))
            })()
          ) : null}

          {section === RailSection.Bookmarks
            ? bookmarks.length === 0
              ? <p className="flyout-panel__empty">{t('personal.railBookmarksEmpty')}</p>
              : bookmarks.map((bookmark) => {
                  const topic = topicByName(bookmark.topic.name)
                  const label = resolveTargetLabel(bookmark.target, topic)
                  return topic ? (
                    <Link key={bookmark.id} to={`/topics/${topic.id}`} className="flyout-panel__item" onClick={onClose}>
                      <span className="flyout-panel__item-label">{label}</span>
                    </Link>
                  ) : (
                    <div key={bookmark.id} className="flyout-panel__item flyout-panel__item--static">
                      <span className="flyout-panel__item-label">{label}</span>
                    </div>
                  )
                })
            : null}

          {section === RailSection.Questions
            ? pendingQuestions.length === 0
              ? <p className="flyout-panel__empty">{t('personal.railQuestionsEmpty')}</p>
              : pendingQuestions.map((pending) => {
                  const topic = topicByName(pending.topic.name)
                  return topic ? (
                    <Link key={pending.id} to={`/topics/${topic.id}`} className="flyout-panel__item" onClick={onClose}>
                      <span className="flyout-panel__item-label">{pending.ask}</span>
                    </Link>
                  ) : (
                    <div key={pending.id} className="flyout-panel__item flyout-panel__item--static">
                      <span className="flyout-panel__item-label">{pending.ask}</span>
                    </div>
                  )
                })
            : null}

          {section === RailSection.Notes
            ? notes.length === 0
              ? <p className="flyout-panel__empty">{t('personal.railNotesEmpty')}</p>
              : notes.map((note) => {
                  const topic = topicByName(note.topic.name)
                  const preview = notePreview(note.text)
                  return topic ? (
                    <Link key={note.id} to={`/topics/${topic.id}`} className="flyout-panel__item" onClick={onClose}>
                      <span className="flyout-panel__item-label">{preview}</span>
                    </Link>
                  ) : (
                    <div key={note.id} className="flyout-panel__item flyout-panel__item--static">
                      <span className="flyout-panel__item-label">{preview}</span>
                    </div>
                  )
                })
            : null}
        </div>
      </div>
    </>
  )
}
