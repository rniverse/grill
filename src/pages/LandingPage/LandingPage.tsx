import { t } from '@/utils/i18n'
import { LogoIcon } from '@/utils/icons'
import { storage } from '@/services/storage'
import { TopicRow } from '@/components/TopicRow/TopicRow'
import './LandingPage.css'

export function LandingPage() {
  // Names only, from local storage — no fetch here. Fetching a topic's real
  // content only happens once the user opens that specific topic.
  const sources = storage.list.sources()

  const summaryText = t('landing.summary', { topics: sources.length })

  return (
    <div className="landing-page">
      <div className="landing-page__content">
        <div className="landing-page__card">
          <div className="landing-page__header">
            <h1 className="landing-page__label">{t('landing.contents')}</h1>
            <span className="landing-page__summary">{summaryText}</span>
          </div>
          <div className="landing-page__mobile-header">
            <div className="landing-page__mobile-logo">
              <LogoIcon size={16} />
            </div>
            <h1 className="landing-page__mobile-title">{t('landing.contents')}</h1>
          </div>
          <p className="landing-page__mobile-summary">{summaryText}</p>
          <div className="landing-page__rows">
            {sources.map((source, index) => (
              <TopicRow
                key={source.id}
                ordinal={String(index + 1).padStart(2, '0')}
                topicId={source.id}
                name={source.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
