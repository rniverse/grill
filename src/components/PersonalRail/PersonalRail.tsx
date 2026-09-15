import { useState } from 'react'
import type { ID, Question, Reference } from '@/types/topic.types'
import type { Bookmark, LocalTargetRef, PendingQuestion, PersonalNote } from '@/types/personal.types'
import {
  deletePendingQuestion,
  deletePersonalNote,
  listBookmarks,
  listPendingQuestions,
  listPersonalNotes,
} from '@/services/storage'
import { locateSelection } from '@/utils/highlight'
import { t } from '@/utils/i18n'
import { PersonalRailTab } from './personal-rail-tab.enum'
import './PersonalRail.css'

const NOTE_PREVIEW_LENGTH = 80

const tabs: { tab: PersonalRailTab; label: string }[] = [
  { tab: PersonalRailTab.Questions, label: t('personal.rail.tab.questions') },
  { tab: PersonalRailTab.Bookmarks, label: t('personal.rail.tab.bookmarks') },
  { tab: PersonalRailTab.Notes, label: t('personal.rail.tab.notes') },
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

// The current text a pending question's selection should still be findable
// in — the question's answer, or the reference's flashcard text.
function currentTargetText(target: LocalTargetRef['target'], questions: Question[], references: Reference[]): string {
  if (target.kind === 'question') {
    return questions.find((question) => question.id === target.id)?.answer.value ?? ''
  }
  return references.find((reference) => reference.id === target.id)?.text.value ?? ''
}

function isPendingQuestionLocatable(pending: PendingQuestion, questions: Question[], references: Reference[]): boolean {
  const text = currentTargetText(pending.target, questions, references)
  return locateSelection(text, pending.selection) !== 'not-found'
}

interface PendingQuestionItemProps {
  pending: PendingQuestion
  references: Reference[]
  onOpenQuestion: (questionId: ID) => void
  onOpenReference: (reference: Reference) => void
  onPersonalLayerChange?: () => void
}

function PendingQuestionItem({
  pending,
  references,
  onOpenQuestion,
  onOpenReference,
  onPersonalLayerChange,
}: PendingQuestionItemProps) {
  return (
    <div
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
        <span className="personal-rail__badge">{t('personal.rail.badge.asked')}</span>
        <button
          type="button"
          className="personal-rail__remove"
          aria-label={t('personal.rail.remove')}
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
  )
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
  const locatablePendingQuestions = pendingQuestions.filter((pending) =>
    isPendingQuestionLocatable(pending, questions, references),
  )
  const needsReviewPendingQuestions = pendingQuestions.filter(
    (pending) => !isPendingQuestionLocatable(pending, questions, references),
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
            <p className="personal-rail__empty">{t('personal.rail.empty.questions')}</p>
          ) : (
            <>
              {locatablePendingQuestions.map((pending) => (
                <PendingQuestionItem
                  key={pending.id}
                  pending={pending}
                  references={references}
                  onOpenQuestion={onOpenQuestion}
                  onOpenReference={onOpenReference}
                  onPersonalLayerChange={onPersonalLayerChange}
                />
              ))}

              {needsReviewPendingQuestions.length > 0 ? (
                <div className="personal-rail__needs-review">
                  <p className="personal-rail__section-heading">{t('personal.rail.needs.review')}</p>
                  {needsReviewPendingQuestions.map((pending) => (
                    <PendingQuestionItem
                      key={pending.id}
                      pending={pending}
                      references={references}
                      onOpenQuestion={onOpenQuestion}
                      onOpenReference={onOpenReference}
                      onPersonalLayerChange={onPersonalLayerChange}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )
        ) : null}

        {activeTab === PersonalRailTab.Bookmarks ? (
          bookmarks.length === 0 ? (
            <p className="personal-rail__empty">{t('personal.rail.empty.bookmarks')}</p>
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
                  {bookmark.target.kind === 'question' ? t('personal.rail.badge.question') : t('personal.rail.badge.reference')}
                </span>
                <p className="personal-rail__title">{targetLabel(bookmark.target, questions, references)}</p>
              </div>
            ))
          )
        ) : null}

        {activeTab === PersonalRailTab.Notes ? (
          notes.length === 0 ? (
            <p className="personal-rail__empty">{t('personal.rail.empty.notes')}</p>
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
                <div className="personal-rail__item-row">
                  <span className="personal-rail__badge">{targetLabel(note.target, questions, references)}</span>
                  <button
                    type="button"
                    className="personal-rail__remove"
                    aria-label={t('personal.rail.remove')}
                    onClick={(event) => {
                      event.stopPropagation()
                      deletePersonalNote(note.id)
                      onPersonalLayerChange?.()
                    }}
                  >
                    ×
                  </button>
                </div>
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
