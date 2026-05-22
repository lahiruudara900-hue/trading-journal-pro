'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DynamicField from '@/components/DynamicField'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, TradeData } from '@/lib/types'
import { loadFields, createDefaultFields, hasFields } from '@/lib/fields'
import { saveTrade } from '@/lib/trades'

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
      if (!userHasFields) {
        setNoFields(true)
        setLoading(false)
        return
      }

      const data = await loadFields(user.id)
      setFields(data)
      setLoading(false)
    }
    init()
  }, [])

  function handleChange(fieldName: string, value: any) {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const result = await saveTrade(userId, formData)
    if (!result) {
      setError('Failed to save trade. Please try again.')
      setSaving(false)
      return
    }

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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div style={{ padding: '1.5rem', maxWidth: '56rem', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                Log New Trade
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#8888a0' }}>
                Fill in your trade details below.
              </p>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : noFields ? (
              /* No fields configured yet */
              <div style={{
                backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧩</div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
                  No fields configured yet
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#8888a0', marginBottom: '1.5rem', maxWidth: '24rem', margin: '0 auto 1.5rem' }}>
                  You need to set up your trade fields before logging trades.
                  You can load the default ICT fields or build your own.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleLoadDefaults}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Loading...' : '📋 Load Default ICT Fields'}
                  </button>
                  <Link href="/fields" className="btn-secondary">
                    🧩 Build My Own Fields
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{
                    backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '0.5rem', padding: '0.75rem 1rem',
                    color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem',
                  }}>{error}</div>
                )}
                {success && (
                  <div style={{
                    backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '0.5rem', padding: '0.75rem 1rem',
                    color: '#34d399', fontSize: '0.875rem', marginBottom: '1rem',
                  }}>✓ Trade saved! Redirecting…</div>
                )}

                {/* Dynamic fields grid */}
                <div style={{
                  backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                  borderRadius: '0.75rem', padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '1rem',
                }}>
                  {fields.map(field => (
                    <div
                      key={field.id}
                      style={{
                        gridColumn: field.field_type === 'textarea' ? '1 / -1' : undefined,
                      }}
                    >
                      <label className="form-label">{field.field_name}</label>
                      <DynamicField
                        field={field}
                        value={formData[field.field_name]}
                        onChange={val => handleChange(field.field_name, val)}
                      />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Link href="/trades/history" className="btn-secondary">Cancel</Link>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving || success}
                    style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
                  >
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