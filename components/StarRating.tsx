'use client'

interface Props {
  value: number
  onChange?: (val: number) => void
  readOnly?: boolean
  max?: number
}

export default function StarRating({ value, onChange, readOnly = false, max = 10 }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: readOnly ? 'default' : 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: '0.125rem',
            color: star <= (value || 0) ? '#f59e0b' : '#2f2f42',
            transition: 'color 0.1s, transform 0.1s',
            transform: 'scale(1)',
          }}
          onMouseOver={e => {
            if (!readOnly) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)'
          }}
          onMouseOut={e => {
            if (!readOnly) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
          title={`${star} / ${max}`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: '0.75rem', color: '#8888a0', marginLeft: '0.25rem' }}>
          {value}/{max}
        </span>
      )}
    </div>
  )
}