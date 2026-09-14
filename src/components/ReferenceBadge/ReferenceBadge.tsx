import './ReferenceBadge.css'

export interface ReferenceBadgeProps {
  label: string
  onSelect: () => void
}

export function ReferenceBadge({ label, onSelect }: ReferenceBadgeProps) {
  return (
    <button type="button" className="reference-badge" onClick={onSelect}>
      {label}
    </button>
  )
}
