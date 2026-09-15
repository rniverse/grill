import { useRef, useState } from 'react'
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
import { downloadPersonalLayer } from '@/utils/download-personal-layer'
import { FlyoutPanel } from '@/components/FlyoutPanel/FlyoutPanel'
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
  // The topic currently in view, if any — threaded down to FlyoutPanel so
  // its References section knows which topic's references to show.
  topicId?: string
}

export function IconRail({ activeSection, topicId }: IconRailProps) {
  const [openSection, setOpenSection] = useState<RailSection | null>(null)
  const sectionButtonRefs = useRef<Partial<Record<RailSection, HTMLButtonElement | null>>>({})

  function toggleSection(section: RailSection): void {
    setOpenSection((current) => (current === section ? null : section))
  }

  // FlyoutPanel closes itself (Escape, scrim click, its own close button, or
  // picking an item) purely by calling onClose — funnel all of those through
  // here so focus reliably returns to the rail button that opened it.
  function closePanel(section: RailSection): void {
    setOpenSection(null)
    sectionButtonRefs.current[section]?.focus()
  }

  return (
    <>
      <nav className="icon-rail">
        <div className="icon-rail__logo">
          <LogoIcon size={17} />
        </div>

        {railSectionButtons.map(({ section, label, Icon }) => (
          <button
            key={section}
            type="button"
            ref={(el) => {
              sectionButtonRefs.current[section] = el
            }}
            className="icon-rail__button"
            aria-label={label}
            aria-current={section === activeSection ? 'true' : undefined}
            aria-expanded={section === openSection}
            onClick={() => toggleSection(section)}
          >
            <Icon size={18} />
          </button>
        ))}

        <button type="button" className="icon-rail__export" aria-label={t('nav.export')} onClick={downloadPersonalLayer}>
          <ExportIcon size={18} />
        </button>
      </nav>

      {openSection ? (
        <FlyoutPanel section={openSection} topicId={topicId} onClose={() => closePanel(openSection)} />
      ) : null}
    </>
  )
}
