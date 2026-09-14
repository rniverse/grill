import { useState } from 'react'
import type { ID, Question, Reference } from '@/types/topic.types'
import type { Bookmark, LocalTargetRef, PendingQuestion, PersonalNote } from '@/types/personal.types'
import { deletePendingQuestion, listBookmarks, listPendingQuestions, listPersonalNotes } from '@/services/storage'
import { t } from '@/utils/i18n'
import { PersonalRailTab } from './personal-rail-tab.enum'
import './PersonalRail.css'

const NOTE_PREVIEW_LENGTH = 80

const tabs: { tab: PersonalRailTab; label: string }[] = [
  { tab: PersonalRailTab.Questions, label: t('personal.railTabQuestions') },
  { tab: PersonalRailTab.Bookmarks, label: t('personal.railTabBookmarks') },
  { tab: PersonalRailTab.Notes, label: t('personal.railTabNotes') },
]

export interface PersonalRailProps {
  topic: { name: string; version: string }
  questions: Question[]
  references: Reference[]
  onOpenQuestion: (questionId: ID) => void
  onOpenReference: (reference: Reference) => void
  onPersonalLayerChange?: () => void
}

function openTarget(
  target: LocalTargetRef['target'],
  references: Reference[],
  onOpenQuestion: (questionId: ID) => void,
  onOpenReference: (reference: Reference) => void,
): void {
  if (target.kind === 'question') {
    onOpenQuestion(target.id)
    return
  }
  const reference = references.find((candidate) => candidate.id === target.id)
  if (reference) {
    onOpenReference(reference)
  }
}

function targetLabel(target: LocalTargetRef['target'], questions: Question[], references: Reference[]): string {
  if (target.kind === 'question') {
    return questions.find((question) => question.id === target.id)?.question ?? target.id
  }
  return references.find((reference) => reference.id === target.id)?.term ?? target.id
}

export function PersonalRail({
  topic,
  questions,
  references,
  onOpenQuestion,
  onOpenReference,
  onPersonalLayerChange,
}: PersonalRailProps) {
  const [activeTab, setActiveTab] = useState<PersonalRailTab>(PersonalRailTab.Questions)

  const pendingQuestions: PendingQuestion[] = listPendingQuestions().filter(
    (pending) => pending.topic.name === topic.name,
  )
  const bookmarks: Bookmark[] = listBookmarks().filter((bookmark) => bookmark.topic.name === topic.name)
  const notes: PersonalNote[] = listPersonalNotes().filter((note) => note.topic.name === topic.name)

  return (
    <aside className="personal-rail">
      <div className="personal-rail__tabs">
        {tabs.map(({ tab, label }) => (
          <button
            key={tab}
            type="button"
            className="personal-rail__tab"
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="personal-rail__items">
        {activeTab === PersonalRailTab.Questions ? (
          pendingQuestions.length === 0 ? (
            <p className="personal-rail__empty">{t('personal.railQuestionsEmpty')}</p>
          ) : (
            pendingQuestions.map((pending) => (
              <div
                key={pending.id}
                className="personal-rail__item"
                role="button"
                tabIndex={0}
                onClick={() => openTarget(pending.target, references, onOpenQuestion, onOpenReference)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    openTarget(pending.target, references, onOpenQuestion, onOpenReference)
                  }
                }}
              >
                <div className="personal-rail__item-row">
                  <span className="personal-rail__badge">{t('personal.railAskedBadge')}</span>
                  <button
                    type="button"
                    className="personal-rail__remove"
                    aria-label={t('personal.railRemove')}
                    onClick={(event) => {
                      event.stopPropagation()
                      deletePendingQuestion(pending.id)
                      onPersonalLayerChange?.()
                    }}
                  >
                    ×
                  </button>
                </div>
                <p className="personal-rail__quote">{pending.selection.text}</p>
                <p className="personal-rail__title">{pending.ask}</p>
              </div>
            ))
          )
        ) : null}

        {activeTab === PersonalRailTab.Bookmarks ? (
          bookmarks.length === 0 ? (
            <p className="personal-rail__empty">{t('personal.railBookmarksEmpty')}</p>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="personal-rail__item"
                role="button"
                tabIndex={0}
                onClick={() => openTarget(bookmark.target, references, onOpenQuestion, onOpenReference)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    openTarget(bookmark.target, references, onOpenQuestion, onOpenReference)
                  }
                }}
              >
                <span className="personal-rail__badge">
                  {bookmark.target.kind === 'question' ? t('personal.railQuestionBadge') : t('personal.railReferenceBadge')}
                </span>
                <p className="personal-rail__title">{targetLabel(bookmark.target, questions, references)}</p>
              </div>
            ))
          )
        ) : null}

        {activeTab === PersonalRailTab.Notes ? (
          notes.length === 0 ? (
            <p className="personal-rail__empty">{t('personal.railNotesEmpty')}</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="personal-rail__item"
                role="button"
                tabIndex={0}
                onClick={() => openTarget(note.target, references, onOpenQuestion, onOpenReference)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    openTarget(note.target, references, onOpenQuestion, onOpenReference)
                  }
                }}
              >
                <span className="personal-rail__badge">{targetLabel(note.target, questions, references)}</span>
                <p className="personal-rail__title">
                  {note.text.length > NOTE_PREVIEW_LENGTH ? `${note.text.slice(0, NOTE_PREVIEW_LENGTH)}…` : note.text}
                </p>
              </div>
            ))
          )
        ) : null}
      </div>
    </aside>
  )
}
