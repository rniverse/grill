import { t } from '@/utils/i18n'
import { CollapsePanelIcon } from '@/utils/icons'
import { RailSection } from '@/components/IconRail/rail-section.enum'
import './FlyoutPanel.css'

export interface FlyoutPanelProps {
  section: RailSection
  topicId?: string
  onClose: () => void
}

// Skeleton — real per-section content (Topics/References/Bookmarks/
// Questions/Notes) lands in the follow-up "implement FlyoutPanel and
// MobileNav" commit. This satisfies the real prop signature so IconRail and
// any page wiring it up can typecheck against it now.
export function FlyoutPanel({ section, onClose }: FlyoutPanelProps) {
  return (
    <div className="flyout-panel">
      <div className="flyout-panel__header">
        <span className="flyout-panel__title">{section}</span>
        <button type="button" className="flyout-panel__close" aria-label={t('nav.panelClose')} onClick={onClose}>
          <CollapsePanelIcon size={15} />
        </button>
      </div>
    </div>
  )
}
