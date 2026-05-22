'use client'
import { useEffect, useState, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import FieldBuilderList from '@/components/FieldBuilderList'
import FieldBuilderModal from '@/components/FieldBuilderModal'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, FieldType } from '@/lib/types'
import {
  loadFields, addField, updateField,
  deleteField, reorderFields, createDefaultFields, hasFields
} from '@/lib/fields'

export default function FieldBuilderPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const load = useCallback(async (uid: string) => {
    const data = await loadFields(uid)
    setFields(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await load(user.id)
    }
    init()
  }, [load])

  async function handleLoadDefaults() {
    if (!confirm('This will add the default ICT trading fields to your setup. Continue?')) return
    setSaving(true)
    await createDefaultFields(userId)
    await load(userId)
    setSaving(false)
    showMsg('success', 'Default fields loaded!')
  }

  async function handleSaveField(data: {
    field_name: string
    field_type: FieldType
    field_options: string[]
  }) {
    setSaving(true)
    if (editingField) {
      const ok = await updateField(editingField.id, data)
      if (ok) {
        setFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...data } : f))
        showMsg('success', 'Field updated!')
      } else {
        showMsg('error', 'Failed to update field.')
      }
    } else {
      const newField = await addField(userId, data, fields.length)
      if (newField) {
        setFields(prev => [...prev, { ...newField, field_options: data.field_options }])
        showMsg('success', 'Field added!')
      } else {
        showMsg('error', 'Failed to add field.')
      }
    }
    setShowModal(false)
    setEditingField(null)
    setSaving(false)
  }

  async function handleDelete(field: Field) {
    setSaving(true)
    const ok = await deleteField(field.id)
    if (ok) {
      setFields(prev => prev.filter(f => f.id !== field.id))
      showMsg('success', `"${field.field_name}" deleted.`)
    } else {
      showMsg('error', 'Failed to delete field.')
    }
    setSaving(false)
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...fields]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setFields(updated)
    await reorderFields(updated)
  }

  async function handleMoveDown(index: number) {
    if (index === fields.length - 1) return
    const updated = [...fields]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setFields(updated)
    await reorderFields(updated)
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div style={{ padding: '1.5rem', maxWidth: '48rem', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                    Field Builder
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: '#8888a0' }}>
                    Create and customize your trade journal fields. Drag to reorder.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {fields.length === 0 && (
                    <button
                      onClick={handleLoadDefaults}
                      disabled={saving}
                      className="btn-secondary"
                      style={{ fontSize: '0.8125rem' }}
                    >
                      📋 Load ICT Defaults
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingField(null); setShowModal(true) }}
                    className="btn-primary"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                marginBottom: '1rem',
                backgroundColor: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: message.type === 'success' ? '#34d399' : '#f87171',
              }}>
                {message.text}
              </div>
            )}

            {/* Info box */}
            <div style={{
              padding: '0.875rem 1rem', borderRadius: '0.75rem', marginBottom: '1.25rem',
              backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
              fontSize: '0.8125rem', color: '#8888a0', lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: '#c0c0d8' }}>How it works:</strong> Add any fields you want.
              They will appear in your Add Trade form automatically.
              Your data is saved as flexible JSON so you can change fields anytime.
            </div>

            {/* Field count */}
            {fields.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#555570', marginBottom: '0.75rem' }}>
                {fields.length} field{fields.length !== 1 ? 's' : ''} configured
              </div>
            )}

            {/* Field list */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <FieldBuilderList
                fields={fields}
                onEdit={field => { setEditingField(field); setShowModal(true) }}
                onDelete={handleDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <FieldBuilderModal
          field={editingField}
          onSave={handleSaveField}
          onClose={() => { setShowModal(false); setEditingField(null) }}
        />
      )}
    </ProtectedRoute>
  )
}