import { Link, useLocation } from 'react-router'
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
import './IconRail.css'

interface RailLink {
  to: string
  label: string
  Icon: typeof TopicsIcon
  isActive: (pathname: string) => boolean
}

const railLinks: RailLink[] = [
  { to: '/', label: t('nav.topics'), Icon: TopicsIcon, isActive: (pathname) => pathname === '/' || pathname.startsWith('/topics') },
  { to: '/references', label: t('nav.references'), Icon: ReferencesIcon, isActive: (pathname) => pathname.startsWith('/references') },
  { to: '/bookmarks', label: t('nav.bookmarks'), Icon: BookmarksIcon, isActive: (pathname) => pathname.startsWith('/bookmarks') },
  { to: '/questions', label: t('nav.myQuestions'), Icon: QuestionsIcon, isActive: (pathname) => pathname.startsWith('/questions') },
  { to: '/notes', label: t('nav.myNotes'), Icon: NotesIcon, isActive: (pathname) => pathname.startsWith('/notes') },
]

export function IconRail() {
  const { pathname } = useLocation()

  return (
    <nav className="icon-rail">
      <Link to="/" className="icon-rail__logo" aria-label={t('nav.brand')}>
        <LogoIcon size={17} />
      </Link>

      {railLinks.map(({ to, label, Icon, isActive }) => (
        <Link
          key={to}
          to={to}
          className="icon-rail__button"
          aria-label={label}
          aria-current={isActive(pathname) ? 'true' : undefined}
        >
          <Icon size={18} />
        </Link>
      ))}

      <button type="button" className="icon-rail__export" aria-label={t('nav.export')} onClick={downloadPersonalLayer}>
        <ExportIcon size={18} />
      </button>
    </nav>
  )
}
