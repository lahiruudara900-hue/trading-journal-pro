'use client'
import { Field } from '@/lib/types'

interface Props {
  field: Field
  value: any
  onChange: (value: any) => void
  readOnly?: boolean
}

export default function DynamicField({ field, value, onChange, readOnly = false }: Props) {
  const { field_name, field_type, field_options } = field

  if (readOnly) {
    return <ReadOnlyField field={field} value={value} />
  }

  switch (field_type) {
    case 'text':
      return (
        <input
          type="text"
          className="form-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter ${field_name}`}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          step="any"
          className="form-input"
          value={value || ''}
          onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
          placeholder="0"
        />
      )

    case 'textarea':
      return (
        <textarea
          className="form-input resize-none"
          rows={3}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter ${field_name}`}
        />
      )

    case 'date':
      return (
        <input
          type="date"
          className="form-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      )

    case 'checkbox':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
          <input
            type="checkbox"
            id={`field-${field.id}`}
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: '#3b82f6' }}
          />
          <label
            htmlFor={`field-${field.id}`}
            style={{ fontSize: '0.875rem', color: '#e8e8f0', cursor: 'pointer' }}
          >
            {value ? 'Yes' : 'No'}
          </label>
        </div>
      )

    case 'dropdown':
      return (
        <select
          className="form-select"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select {field_name}</option>
          {field_options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )

    case 'multiselect':
      const selected: string[] = Array.isArray(value) ? value : []
      return (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          padding: '0.625rem', backgroundColor: '#111118',
          border: '1px solid #1f1f2e', borderRadius: '0.5rem',
          minHeight: '2.75rem'
        }}>
          {field_options.map(opt => {
            const isSelected = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = isSelected
                    ? selected.filter(s => s !== opt)
                    : [...selected, opt]
                  onChange(next)
                }}
                style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px solid #1f1f2e',
                  backgroundColor: isSelected ? 'rgba(59,130,246,0.2)' : '#1e1e2a',
                  color: isSelected ? '#60a5fa' : '#8888a0',
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            )
          })}
          {field_options.length === 0 && (
            <span style={{ fontSize: '0.75rem', color: '#555570' }}>
              No options — add them in Field Builder
            </span>
          )}
        </div>
      )

    default:
      return (
        <input
          type="text"
          className="form-input"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      )
  }
}

// ── Read-only display version ─────────────────────────────
function ReadOnlyField({ field, value }: { field: Field; value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#555570', fontSize: '0.875rem' }}>—</span>
  }

  switch (field.field_type) {
    case 'checkbox':
      return <span style={{ fontSize: '0.875rem' }}>{value ? '✅ Yes' : '❌ No'}</span>

    case 'multiselect':
      const arr = Array.isArray(value) ? value : [value]
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {arr.map((v: string) => (
            <span key={v} style={{
              padding: '0.125rem 0.5rem',
              backgroundColor: 'rgba(59,130,246,0.1)',
              color: '#60a5fa',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}>{v}</span>
          ))}
        </div>
      )

    case 'number':
      return (
        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#e8e8f0' }}>
          {value}
        </span>
      )

    default:
      return (
        <span style={{ fontSize: '0.875rem', color: '#e8e8f0' }}>
          {String(value)}
        </span>
      )
  }
}