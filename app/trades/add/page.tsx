'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DynamicField from '@/components/DynamicField'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, TradeData } from '@/lib/types'
import { loadFields, createDefaultFields, hasFields } from '@/lib/fields'
import { saveTrade } from '@/lib/trades'
import { calculateRR } from '@/lib/calculations'

export default function AddTradePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [fields, setFields] = useState<Field[]>([])
  const [formData, setFormData] = useState<TradeData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [noFields, setNoFields] = useState(false)

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
    const data = await loadFields(userId)
    setFields(data)
    setNoFields(false)
    setSaving(false)
  }

  // Group fields: screenshot fields separate, textarea fields at bottom
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
                <div className="page-title">Log Trade</div>
                <div className="page-subtitle">Record your trade details</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/fields" className="btn btn-secondary">🧩 Fields</Link>
                <Link href="/trades/history" className="btn btn-ghost">Cancel</Link>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : noFields ? (
              <div className="empty-state">
                <div className="es-icon">🧩</div>
                <div className="es-text">No fields configured yet.</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={handleLoadDefaults} disabled={saving} className="btn btn-primary">
                    {saving ? 'Loading…' : '📋 Load ICT Defaults'}
                  </button>
                  <Link href="/fields" className="btn btn-secondary">🧩 Build Fields</Link>
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

                {/* Main fields grid */}
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
                        <div key={field.id} style={{
                          gridColumn: isStarRating ? '1 / -1' : undefined,
                        }}>
                          <label className="form-label">
                            {field.field_name}
                            {isRR && (
                              <span style={{ marginLeft: '6px', color: 'var(--accent)', fontSize: '9px', fontWeight: 700 }}>
                                AUTO
                              </span>
                            )}
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
                          <DynamicField
                            field={field}
                            value={formData[field.field_name]}
                            onChange={val => handleChange(field.field_name, val)}
                            userId={userId}
                          />
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
                          <DynamicField
                            field={field}
                            value={formData[field.field_name]}
                            onChange={val => handleChange(field.field_name, val)}
                            userId={userId}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link href="/trades/history" className="btn btn-secondary">Cancel</Link>
                  <button type="submit" className="btn btn-primary" disabled={saving || success}>
                    {saving ? 'Saving…' : 'Save Trade'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}