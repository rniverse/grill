import {
  BookmarksIcon,
  ExportIcon,
  LogoIcon,
  NotesIcon,
  QuestionsIcon,
  ReferencesIcon,
  TopicsIcon,
} from '@/utils/icons'
import { t } from '@/utils/i18n'
import { exportPersonalLayer } from '@/services/storage'
import { RailSection } from './rail-section.enum'
import './IconRail.css'

interface RailSectionButton {
  section: RailSection
  label: string
  Icon: typeof TopicsIcon
}

const railSectionButtons: RailSectionButton[] = [
  { section: RailSection.Topics, label: t('nav.topics'), Icon: TopicsIcon },
  { section: RailSection.References, label: t('nav.references'), Icon: ReferencesIcon },
  { section: RailSection.Bookmarks, label: t('nav.bookmarks'), Icon: BookmarksIcon },
  { section: RailSection.Questions, label: t('nav.myQuestions'), Icon: QuestionsIcon },
  { section: RailSection.Notes, label: t('nav.myNotes'), Icon: NotesIcon },
]

function downloadPersonalLayer(): void {
  const json = exportPersonalLayer()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `grill-prep-personal-layer-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoking synchronously right after click() is flaky outside Chrome —
  // give the browser a tick to start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export interface IconRailProps {
  activeSection: RailSection
}

export function IconRail({ activeSection }: IconRailProps) {
  return (
    <nav className="icon-rail">
      <div className="icon-rail__logo">
        <LogoIcon size={17} />
      </div>

      {railSectionButtons.map(({ section, label, Icon }) => (
        <button
          key={section}
          type="button"
          className="icon-rail__button"
          aria-label={label}
          aria-current={section === activeSection ? 'true' : undefined}
        >
          <Icon size={18} />
        </button>
      ))}

      <button type="button" className="icon-rail__export" aria-label={t('nav.export')} onClick={downloadPersonalLayer}>
        <ExportIcon size={18} />
      </button>
    </nav>
  )
}
