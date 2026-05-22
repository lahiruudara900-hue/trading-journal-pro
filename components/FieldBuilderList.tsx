'use client'
import { useState } from 'react'
import { Field } from '@/lib/types'
import FieldTypeIcon from './FieldTypeIcon'

interface Props {
  fields: Field[]
  onEdit: (field: Field) => void
  onDelete: (field: Field) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

export default function FieldBuilderList({ fields, onEdit, onDelete, onMoveUp, onMoveDown }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (fields.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem',
        backgroundColor: '#16161f', border: '1px solid #1f1f2e',
        borderRadius: '0.75rem', color: '#8888a0',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🧩</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', marginBottom: '0.25rem' }}>No fields yet</div>
        <div style={{ fontSize: '0.8rem' }}>Click "Add Field" to create your first custom field</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {fields.map((field, index) => (
        <div
          key={field.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1rem',
            backgroundColor: '#16161f', border: '1px solid #1f1f2e',
            borderRadius: '0.75rem',
            transition: 'border-color 0.15s',
          }}
        >
          {/* Order controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flexShrink: 0 }}>
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              style={{
                background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer',
                color: index === 0 ? '#2f2f42' : '#8888a0', fontSize: '0.75rem', padding: '0.125rem',
                lineHeight: 1,
              }}
              title="Move up"
            >▲</button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === fields.length - 1}
              style={{
                background: 'none', border: 'none', cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer',
                color: index === fields.length - 1 ? '#2f2f42' : '#8888a0', fontSize: '0.75rem', padding: '0.125rem',
                lineHeight: 1,
              }}
              title="Move down"
            >▼</button>
          </div>

          {/* Order number */}
          <div style={{
            width: '1.5rem', height: '1.5rem', borderRadius: '50%',
            backgroundColor: '#1e1e2a', border: '1px solid #2f2f42',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', color: '#555570', fontWeight: 600, flexShrink: 0,
          }}>
            {index + 1}
          </div>

          {/* Type icon */}
          <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>
            <FieldTypeIcon type={field.field_type} />
          </div>

          {/* Field info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '0.125rem' }}>
              {field.field_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#555570' }}>
              {field.field_type}
              {field.field_options?.length > 0 && (
                <span style={{ marginLeft: '0.5rem', color: '#3f3f52' }}>
                  · {field.field_options.slice(0, 4).join(', ')}
                  {field.field_options.length > 4 && ` +${field.field_options.length - 4} more`}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => onEdit(field)}
              style={{
                padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
                backgroundColor: '#1e1e2a', color: '#8888a0',
                border: '1px solid #1f1f2e', borderRadius: '0.375rem',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >Edit</button>
            <button
              onClick={() => {
                if (confirm(`Delete field "${field.field_name}"? This won't delete existing trade data.`)) {
                  onDelete(field)
                }
              }}
              style={{
                padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
                backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.375rem',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}