import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { t } from '@/utils/i18n'
import './TopicTagFilter.css'

export interface TopicTagFilterProps {
  tags: string[]
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TopicTagFilter({ tags, selected, onChange }: TopicTagFilterProps) {
  const anchor = useComboboxAnchor()

  return (
    <Combobox items={tags} multiple value={selected} onValueChange={onChange}>
      <ComboboxChips ref={anchor} className="topic-tag-filter__chips">
        <ComboboxValue>
          {(value: string[]) => value.map((tag) => <ComboboxChip key={tag}>{tag}</ComboboxChip>)}
        </ComboboxValue>
        <ComboboxChipsInput placeholder={t('topic.filter.placeholder')} />
        <ComboboxClear aria-label={t('topic.filter.clear')} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>{(tag: string) => <ComboboxItem key={tag} value={tag}>{tag}</ComboboxItem>}</ComboboxList>
        <ComboboxEmpty>{t('topic.filter.empty')}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}
