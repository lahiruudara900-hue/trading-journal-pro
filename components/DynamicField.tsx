'use client'
import { Field } from '@/lib/types'
import StarRating from './StarRating'
import MultiScreenshotUpload from './MultiScreenshotUpload'

interface Props {
  field: Field
  value: any
  onChange: (value: any) => void
  readOnly?: boolean
  userId?: string
}

export default function DynamicField({ field, value, onChange, readOnly = false, userId }: Props) {
  const { field_name, field_type, field_options } = field

  const isStarRating =
    field_name.toLowerCase().includes('rule score') ||
    field_name.toLowerCase().includes('rating') ||
    field_name.toLowerCase().includes('score')

  const isRR =
    field_name.toLowerCase().includes('r:r') ||
    field_name.toLowerCase().includes('rr ratio') ||
    field_name.toLowerCase().includes('risk reward') ||
    field_name.toLowerCase().includes('risk-reward')

  if (readOnly) {
    return <ReadOnlyField field={field} value={value} userId={userId} />
  }

  // Screenshot field type
  if (field_type === 'screenshot') {
    const urls = Array.isArray(value) ? value : (value ? [value] : [])
    if (!userId) return <p style={{ fontSize: '0.75rem', color: '#555570' }}>Loading…</p>
    return (
      <MultiScreenshotUpload
        value={urls}
        onChange={onChange}
        userId={userId}
        max={5}
      />
    )
  }

  // Star rating
  if (field_type === 'number' && isStarRating) {
    return (
      <StarRating
        value={parseFloat(value) || 0}
        onChange={onChange}
        max={10}
      />
    )
  }

  // R:R auto field
  if (field_type === 'number' && isRR) {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          value={value || ''}
          readOnly
          placeholder="Auto-calculated"
          style={{
            backgroundColor: '#0e0e16',
            cursor: 'not-allowed',
            color: value ? '#34d399' : '#555570',
            fontFamily: 'monospace',
          }}
        />
        <span style={{
          position: 'absolute', right: '0.625rem', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.65rem', color: '#3b82f6', pointerEvents: 'none',
          fontWeight: 600,
        }}>AUTO</span>
      </div>
    )
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
          <label htmlFor={`field-${field.id}`} style={{ fontSize: '0.875rem', color: '#e8e8f0', cursor: 'pointer' }}>
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
          minHeight: '2.75rem',
        }}>
          {field_options.map(opt => {
            const isSel = selected.includes(opt)
            return (
              <button key={opt} type="button"
                onClick={() => onChange(isSel ? selected.filter(s => s !== opt) : [...selected, opt])}
                style={{
                  padding: '0.25rem 0.625rem', borderRadius: '0.375rem',
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                  border: isSel ? '1px solid rgba(59,130,246,0.5)' : '1px solid #1f1f2e',
                  backgroundColor: isSel ? 'rgba(59,130,246,0.2)' : '#1e1e2a',
                  color: isSel ? '#60a5fa' : '#8888a0', transition: 'all 0.15s',
                }}
              >{opt}</button>
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
        <input type="text" className="form-input"
          value={value || ''} onChange={e => onChange(e.target.value)} />
      )
  }
}

function ReadOnlyField({ field, value, userId }: { field: Field; value: any; userId?: string }) {
  if (field.field_type === 'screenshot') {
    const urls = Array.isArray(value) ? value : (value ? [value] : [])
    if (urls.length === 0) return <span style={{ color: '#555570', fontSize: '0.875rem' }}>—</span>
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: urls.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.5rem',
      }}>
        {urls.map((url: string, i: number) => (
          <img key={url} src={url} alt={`Screenshot ${i + 1}`}
            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #1f1f2e' }}
          />
        ))}
      </div>
    )
  }

  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#555570', fontSize: '0.875rem' }}>—</span>
  }

  const isStarRating =
    field.field_name.toLowerCase().includes('rule score') ||
    field.field_name.toLowerCase().includes('rating') ||
    field.field_name.toLowerCase().includes('score')

  if (field.field_type === 'number' && isStarRating) {
    return <StarRating value={parseFloat(value) || 0} readOnly max={10} />
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
              padding: '0.125rem 0.5rem', backgroundColor: 'rgba(59,130,246,0.1)',
              color: '#60a5fa', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 500,
            }}>{v}</span>
          ))}
        </div>
      )
    default:
      return <span style={{ fontSize: '0.875rem', color: '#e8e8f0', whiteSpace: 'pre-wrap' }}>{String(value)}</span>
  }
}