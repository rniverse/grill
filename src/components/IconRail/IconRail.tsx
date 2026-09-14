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

      <button type="button" className="icon-rail__export" aria-label={t('nav.export')}>
        <ExportIcon size={18} />
      </button>
    </nav>
  )
}
