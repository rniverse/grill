import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { PersonalNote } from '@/types/personal.types'
import { listPersonalNotes } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import './NotesPage.css'

const NOTE_PREVIEW_LENGTH = 80

interface LoadedTopicSummary {
  id: string
  name: string
}

function notePreview(text: string): string {
  return text.length > NOTE_PREVIEW_LENGTH ? `${text.slice(0, NOTE_PREVIEW_LENGTH)}…` : text
}

export function NotesPage() {
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

  const notes: PersonalNote[] = listPersonalNotes()

  return (
    <div className="notes-page">
      <IconRail />
      <div className="notes-page__mobile-header">
        <MobileNav />
      </div>
      <div className="notes-page__content">
        <div className="notes-page__card">
          <h1 className="notes-page__title">{t('notes.title')}</h1>
          <div className="notes-page__items">
            {notes.length === 0 ? (
              <p className="notes-page__empty">{t('personal.railNotesEmpty')}</p>
            ) : (
              notes.map((note) => {
                const topic = topicByName(note.topic.name)
                const preview = notePreview(note.text)
                return topic ? (
                  <Link key={note.id} to={`/topics/${topic.id}`} className="notes-page__item">
                    <span className="notes-page__item-label">{preview}</span>
                  </Link>
                ) : (
                  <div key={note.id} className="notes-page__item notes-page__item--static">
                    <span className="notes-page__item-label">{preview}</span>
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
