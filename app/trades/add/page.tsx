'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DynamicField from '@/components/DynamicField'
import FieldBuilderList from '@/components/FieldBuilderList'
import FieldBuilderModal from '@/components/FieldBuilderModal'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, FieldType, TradeData } from '@/lib/types'
import {
  loadFields, createDefaultFields, hasFields,
  addField, updateField, deleteField, reorderFields, deleteAllPremarketFields
} from '@/lib/fields'
import { saveTrade } from '@/lib/trades'
import { calculateRR } from '@/lib/calculations'
import { getSupabaseClient as gsb } from '@/lib/supabase'

type Tab = 'log' | 'fields'

export default function AddTradePage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('log')
  const [userId, setUserId] = useState('')
  const [fields, setFields] = useState<Field[]>([])
  const [formData, setFormData] = useState<TradeData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [noFields, setNoFields] = useState(false)

  // Field builder state
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [fieldSaving, setFieldSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const userHasFields = await hasFields(user.id)
      if (!userHasFields) { setNoFields(true); setLoading(false); return }
      const data = await loadFields(user.id)
      setFields(data)
      setLoading(false)
    }
    init()
  }, [])

  async function reloadFields(uid: string) {
    const data = await loadFields(uid)
    setFields(data)
    setNoFields(data.length === 0)
  }

  function handleChange(fieldName: string, value: any) {
    setFormData(prev => {
      const updated = { ...prev, [fieldName]: value }
      const entryField = fields.find(f => f.field_name.toLowerCase().includes('entry'))
      const slField = fields.find(f => f.field_name.toLowerCase().includes('stop'))
      const tpField = fields.find(f => f.field_name.toLowerCase().includes('take'))
      const rrField = fields.find(f =>
        f.field_name.toLowerCase().includes('r:r') ||
        f.field_name.toLowerCase().includes('rr') ||
        f.field_name.toLowerCase().includes('risk reward')
      )
      if (entryField && slField && tpField && rrField) {
        const entry = parseFloat(updated[entryField.field_name]) || 0
        const sl = parseFloat(updated[slField.field_name]) || 0
        const tp = parseFloat(updated[tpField.field_name]) || 0
        if (entry && sl && tp) updated[rrField.field_name] = calculateRR(entry, sl, tp)
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSaving(true)
    const result = await saveTrade(userId, formData)
    if (!result) { setError('Failed to save trade.'); setSaving(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/trades/history'), 1200)
  }

  async function handleLoadDefaults() {
    setSaving(true)
    await createDefaultFields(userId)
    await reloadFields(userId)
    setSaving(false)
    showMsg('success', 'Default fields loaded!')
  }

  // Field builder handlers
  async function handleSaveField(data: { field_name: string; field_type: FieldType; field_options: string[] }) {
    setFieldSaving(true)
    if (editingField) {
      const ok = await updateField(editingField.id, data)
      if (ok) setFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...data } : f))
      showMsg('success', 'Field updated!')
    } else {
      const newField = await addField(userId, data, fields.length)
      if (newField) setFields(prev => [...prev, newField])
      showMsg('success', 'Field added!')
    }
    setShowFieldModal(false)
    setEditingField(null)
    setFieldSaving(false)
  }

  async function handleDeleteField(field: Field) {
    const ok = await deleteField(field.id)
    if (ok) setFields(prev => prev.filter(f => f.id !== field.id))
    showMsg('success', `"${field.field_name}" deleted.`)
  }

  async function handleDeleteAllFields() {
    if (!confirm(`Delete ALL ${fields.length} fields?`)) return
    setFieldSaving(true)
    const supabase = getSupabaseClient()
    await supabase.from('fields').delete().eq('user_id', userId)
    setFields([])
    setNoFields(true)
    setFieldSaving(false)
    showMsg('success', 'All fields deleted.')
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

  const regularFields = fields.filter(f => f.field_type !== 'screenshot' && f.field_type !== 'textarea')
  const textareaFields = fields.filter(f => f.field_type === 'textarea')
  const screenshotFields = fields.filter(f => f.field_type === 'screenshot')

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px', maxWidth: '860px', margin: '0 auto' }}>

            {/* Header */}
            <div className="page-header">
              <div>
                <div className="page-title">
                  {tab === 'log' ? 'Log Trade' : 'Manage Fields'}
                </div>
                <div className="page-subtitle">
                  {tab === 'log' ? 'Record your trade details' : 'Add, edit, and reorder your trade fields'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTab(tab === 'log' ? 'fields' : 'log')}
                  className="btn btn-secondary"
                >
                  {tab === 'log' ? '🧩 Manage Fields' : '➕ Log Trade'}
                </button>
                {tab === 'log' && (
                  <Link href="/trades/history" className="btn btn-ghost">History</Link>
                )}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                background: message.type === 'success' ? 'rgba(0,201,128,0.1)' : 'rgba(255,77,106,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(0,201,128,0.2)' : 'rgba(255,77,106,0.2)'}`,
                color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
                fontSize: '13px',
              }}>{message.text}</div>
            )}

            {/* ── LOG TRADE TAB ────────────────── */}
            {tab === 'log' && (
              <>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : noFields ? (
                  <div className="empty-state">
                    <div className="es-icon">🧩</div>
                    <div className="es-text">No fields configured yet.</div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                      <button onClick={handleLoadDefaults} disabled={saving} className="btn btn-primary">
                        {saving ? 'Loading…' : '📋 Load ICT Defaults'}
                      </button>
                      <button onClick={() => setTab('fields')} className="btn btn-secondary">
                        🧩 Build My Own Fields
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                        background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)',
                        color: 'var(--red)', fontSize: '13px',
                      }}>{error}</div>
                    )}
                    {success && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                        background: 'rgba(0,201,128,0.1)', border: '1px solid rgba(0,201,128,0.2)',
                        color: 'var(--green)', fontSize: '13px',
                      }}>✓ Trade saved! Redirecting…</div>
                    )}

                    {/* Regular fields */}
                    <div className="card" style={{ marginBottom: '12px' }}>
                      <div className="section-title">Trade Details</div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '14px',
                      }}>
                        {regularFields.map(field => {
                          const isRR = field.field_name.toLowerCase().includes('r:r') ||
                            field.field_name.toLowerCase().includes('risk reward')
                          const isStarRating = field.field_name.toLowerCase().includes('rule score') ||
                            field.field_name.toLowerCase().includes('rating')
                          return (
                            <div key={field.id} style={{ gridColumn: isStarRating ? '1 / -1' : undefined }}>
                              <label className="form-label">
                                {field.field_name}
                                {isRR && <span style={{ marginLeft: '6px', color: 'var(--accent)', fontSize: '9px', fontWeight: 700 }}>AUTO</span>}
                              </label>
                              <DynamicField
                                field={field}
                                value={formData[field.field_name]}
                                onChange={val => handleChange(field.field_name, val)}
                                userId={userId}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Textarea fields */}
                    {textareaFields.length > 0 && (
                      <div className="card" style={{ marginBottom: '12px' }}>
                        <div className="section-title">Notes & Review</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {textareaFields.map(field => (
                            <div key={field.id}>
                              <label className="form-label">{field.field_name}</label>
                              <DynamicField field={field} value={formData[field.field_name]}
                                onChange={val => handleChange(field.field_name, val)} userId={userId} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshot fields */}
                    {screenshotFields.length > 0 && (
                      <div className="card" style={{ marginBottom: '12px' }}>
                        <div className="section-title">Chart Screenshots</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {screenshotFields.map(field => (
                            <div key={field.id}>
                              <label className="form-label">{field.field_name}</label>
                              <DynamicField field={field} value={formData[field.field_name]}
                                onChange={val => handleChange(field.field_name, val)} userId={userId} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link href="/trades/history" className="btn btn-secondary">Cancel</Link>
                      <button type="submit" className="btn btn-primary" disabled={saving || success}>
                        {saving ? 'Saving…' : 'Save Trade'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ── MANAGE FIELDS TAB ────────────── */}
            {tab === 'fields' && (
              <div>
                {/* Field builder buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {fields.length > 0 && (
                    <button onClick={handleDeleteAllFields} disabled={fieldSaving} className="btn btn-danger">
                      🗑️ Delete All
                    </button>
                  )}
                  <button onClick={handleLoadDefaults} disabled={fieldSaving} className="btn btn-secondary">
                    📋 Load ICT Defaults
                  </button>
                  <button
                    onClick={() => { setEditingField(null); setShowFieldModal(true) }}
                    className="btn btn-primary"
                  >
                    + Add Field
                  </button>
                </div>

                {/* Info */}
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                  background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.12)',
                  fontSize: '12.5px', color: 'var(--text3)', lineHeight: 1.6,
                }}>
                  💡 Fields appear in your Log Trade form automatically. Add, edit, delete, and reorder anytime.
                </div>

                {fields.length > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>
                    {fields.length} field{fields.length !== 1 ? 's' : ''} configured
                  </div>
                )}

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <FieldBuilderList
                    fields={fields}
                    onEdit={f => { setEditingField(f); setShowFieldModal(true) }}
                    onDelete={handleDeleteField}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Field modal */}
      {showFieldModal && (
        <FieldBuilderModal
          field={editingField}
          onSave={handleSaveField}
          onClose={() => { setShowFieldModal(false); setEditingField(null) }}
        />
      )}
    </ProtectedRoute>
  )
}