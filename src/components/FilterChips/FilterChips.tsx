import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import './FilterChips.css'

export interface FilterChipsProps {
  tags: string[]
  active: string
  onSelect: (tag: string) => void
}

export function FilterChips({ tags, active, onSelect }: FilterChipsProps) {
  return (
    <ToggleGroup
      className="filter-chips"
      value={[active]}
      onValueChange={(value) => {
        // Base UI's single-select ToggleGroup reports the pressed set as an
        // array; deselecting the active item yields []. Treat that as a
        // no-op so the filter never clears itself.
        const [tag] = value
        if (tag) {
          onSelect(tag)
        }
      }}
    >
      {tags.map((tag) => (
        <ToggleGroupItem key={tag} value={tag} className="filter-chips__chip">
          {tag}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
