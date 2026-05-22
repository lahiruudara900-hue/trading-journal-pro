'use client'
import { useState, useEffect } from 'react'
import { Field, FieldType } from '@/lib/types'

interface Props {
  field?: Field | null
  onSave: (data: { field_name: string; field_type: FieldType; field_options: string[] }) => void
  onClose: () => void
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string; desc: string }[] = [
  { value: 'text',        label: 'Text',         icon: '📝', desc: 'Short text input' },
  { value: 'number',      label: 'Number',       icon: '🔢', desc: 'Numeric value' },
  { value: 'dropdown',    label: 'Dropdown',     icon: '🔽', desc: 'Pick one option' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️', desc: 'Pick multiple options' },
  { value: 'date',        label: 'Date',         icon: '📅', desc: 'Date picker' },
  { value: 'checkbox',    label: 'Checkbox',     icon: '✅', desc: 'Yes / No toggle' },
  { value: 'textarea',    label: 'Text Area',    icon: '📄', desc: 'Long text / notes' },
]

export default function FieldBuilderModal({ field, onSave, onClose }: Props) {
  const [name, setName] = useState(field?.field_name || '')
  const [type, setType] = useState<FieldType>(field?.field_type || 'text')
  const [options, setOptions] = useState<string[]>(field?.field_options || [])
  const [newOption, setNewOption] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (field) {
      setName(field.field_name)
      setType(field.field_type)
      setOptions(field.field_options || [])
    }
  }, [field])

  function addOption() {
    const trimmed = newOption.trim()
    if (!trimmed) return
    if (options.includes(trimmed)) { setError('Option already exists'); return }
    setOptions([...options, trimmed])
    setNewOption('')
    setError('')
  }

  function removeOption(opt: string) {
    setOptions(options.filter(o => o !== opt))
  }

  function handleSave() {
    if (!name.trim()) { setError('Field name is required'); return }
    if ((type === 'dropdown' || type === 'multiselect') && options.length === 0) {
      setError('Add at least one option for this field type')
      return
    }
    onSave({ field_name: name.trim(), field_type: type, field_options: options })
  }

  const needsOptions = type === 'dropdown' || type === 'multiselect'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 10,
        backgroundColor: '#16161f', border: '1px solid #1f1f2e',
        borderRadius: '0.75rem', padding: '1.5rem',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>
            {field ? 'Edit Field' : 'Add New Field'}
          </h2>
          <button onClick={onClose} style={{ color: '#8888a0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', padding: '0.75rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Field Name */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Field Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Pair, Session, Notes..."
            autoFocus
          />
        </div>

        {/* Field Type */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Field Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {FIELD_TYPES.map(ft => (
              <button
                key={ft.value}
                type="button"
                onClick={() => { setType(ft.value); setError('') }}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: type === ft.value ? '1px solid rgba(59,130,246,0.5)' : '1px solid #1f1f2e',
                  backgroundColor: type === ft.value ? 'rgba(59,130,246,0.1)' : '#111118',
                  color: type === ft.value ? '#60a5fa' : '#8888a0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{ft.icon} {ft.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.125rem' }}>{ft.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options (for dropdown / multiselect) */}
        {needsOptions && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Options</label>

            {/* Existing options */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
              {options.map(opt => (
                <span key={opt} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#1e1e2a', border: '1px solid #2f2f42',
                  borderRadius: '0.375rem', fontSize: '0.75rem', color: '#c0c0d8',
                }}>
                  {opt}
                  <button
                    type="button"
                    onClick={() => removeOption(opt)}
                    style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}
                  >✕</button>
                </span>
              ))}
              {options.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#555570' }}>No options yet</span>
              )}
            </div>

            {/* Add option input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                placeholder="Type an option and press Add"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
              />
              <button
                type="button"
                onClick={addOption}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleSave} className="btn-primary">
            {field ? 'Save Changes' : 'Add Field'}
          </button>
        </div>
      </div>
    </div>
  )
}