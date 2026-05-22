import { FieldType } from '@/lib/types'

export default function FieldTypeIcon({ type }: { type: FieldType }) {
  const icons: Record<FieldType, string> = {
    text:        '📝',
    number:      '🔢',
    dropdown:    '🔽',
    multiselect: '☑️',
    date:        '📅',
    checkbox:    '✅',
    textarea:    '📄',
  }
  return <span title={type}>{icons[type] || '📝'}</span>
}