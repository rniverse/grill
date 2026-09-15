import { t } from '@/utils/i18n'
import { MenuIcon } from '@/utils/icons'
import './MobileNav.css'

export interface MobileNavProps {
  activeTopicId?: string
}

// Skeleton — the real hamburger-trigger + slide-in drawer (Topics list,
// "Yours" personal-layer summary, export button) lands in the follow-up
// "implement FlyoutPanel and MobileNav" commit. This satisfies the real
// prop signature so LandingPage/TopicPage can drop this in and typecheck
// against it now.
export function MobileNav({}: MobileNavProps) {
  return (
    <div className="mobile-nav">
      <button type="button" className="mobile-nav__trigger" aria-label={t('nav.menuOpen')}>
        <MenuIcon size={16} />
      </button>
    </div>
  )
}
