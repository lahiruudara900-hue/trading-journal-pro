'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DynamicField from '@/components/DynamicField'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade, Field, TradeData } from '@/lib/types'
import { loadFields } from '@/lib/fields'
import { loadTrade, updateTrade } from '@/lib/trades'

export default function EditTradePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [formData, setFormData] = useState<TradeData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function init() {
      if (!id) return
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [tradeData, fieldsData] = await Promise.all([
        loadTrade(id),
        loadFields(user.id),
      ])
      if (tradeData) {
        setTrade(tradeData)
        setFormData(tradeData.data || {})
      }
      setFields(fieldsData)
      setLoading(false)
    }
    init()
  }, [id])

  function handleChange(fieldName: string, value: any) {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const ok = await updateTrade(id, formData)
    if (!ok) {
      setError('Failed to update trade.')
      setSaving(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push(`/trades/${id}`), 1200)
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div style={{ padding: '1.5rem', maxWidth: '56rem', margin: '0 auto' }}>

            <Link
              href={`/trades/${id}`}
              style={{ fontSize: '0.875rem', color: '#8888a0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.25rem' }}
            >
              ← Back
            </Link>

            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Edit Trade</h1>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : !trade ? (
              <div style={{ textAlign: 'center', color: '#8888a0' }}>Trade not found.</div>
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
                  }}>✓ Trade updated! Redirecting…</div>
                )}

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
                      style={{ gridColumn: field.field_type === 'textarea' ? '1 / -1' : undefined }}
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

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Link href={`/trades/${id}`} className="btn-secondary">Cancel</Link>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving || success}
                    style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
                  >
                    {saving ? 'Saving…' : 'Update Trade'}
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