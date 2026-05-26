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

      // Find field names for auto R:R
      const allFields = fields
      const entryField = allFields.find(f => f.field_name.toLowerCase().includes('entry'))
      const slField = allFields.find(f =>
        f.field_name.toLowerCase().includes('stop') || f.field_name.toLowerCase() === 'sl'
      )
      const tpField = allFields.find(f =>
        f.field_name.toLowerCase().includes('take') || f.field_name.toLowerCase() === 'tp'
      )
      const rrField = allFields.find(f =>
        f.field_name.toLowerCase().includes('r:r') ||
        f.field_name.toLowerCase().includes('rr') ||
        f.field_name.toLowerCase().includes('risk reward')
      )

      if (entryField && slField && tpField && rrField) {
        const entry = parseFloat(updated[entryField.field_name]) || 0
        const sl = parseFloat(updated[slField.field_name]) || 0
        const tp = parseFloat(updated[tpField.field_name]) || 0
        if (entry && sl && tp) {
          updated[rrField.field_name] = calculateRR(entry, sl, tp)
        }
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

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 0, paddingTop: '3.5rem', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-56 md:pt-0">
          <div style={{ padding: '1.5rem', maxWidth: '56rem', margin: '0 auto' }}>

            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                Log New Trade
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#8888a0' }}>Fill in your trade details below.</p>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : noFields ? (
              <div style={{ backgroundColor: '#16161f', border: '1px solid #1f1f2e', borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧩</div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>No fields configured yet</h2>
                <p style={{ fontSize: '0.875rem', color: '#8888a0', marginBottom: '1.5rem' }}>Set up your fields first, or load the default ICT fields.</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={handleLoadDefaults} disabled={saving} className="btn-primary">
                    {saving ? 'Loading...' : '📋 Load Default ICT Fields'}
                  </button>
                  <Link href="/fields" className="btn-secondary">🧩 Build My Own Fields</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
                )}
                {success && (
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#34d399', fontSize: '0.875rem', marginBottom: '1rem' }}>✓ Trade saved! Redirecting…</div>
                )}

                <div style={{
                  backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                  borderRadius: '0.75rem', padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '1rem', marginBottom: '1rem',
                }}>
                  {fields.map(field => {
                    const isFullWidth =
                      field.field_type === 'textarea' ||
                      field.field_type === 'screenshot' ||
                      field.field_name.toLowerCase().includes('rule score') ||
                      field.field_name.toLowerCase().includes('rating')

                    return (
                      <div key={field.id} style={{ gridColumn: isFullWidth ? '1 / -1' : undefined }}>
                        <label style={{
                          display: 'block', fontSize: '0.75rem', fontWeight: 500,
                          color: '#8888a0', marginBottom: '0.375rem',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {field.field_name}
                          {(field.field_name.toLowerCase().includes('r:r') ||
                            field.field_name.toLowerCase().includes('risk reward')) && (
                            <span style={{ marginLeft: '0.375rem', color: '#3b82f6', fontSize: '0.65rem', fontWeight: 600 }}>AUTO</span>
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

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <Link href="/trades/history" className="btn-secondary">Cancel</Link>
                  <button type="submit" className="btn-primary" disabled={saving || success}
                    style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
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