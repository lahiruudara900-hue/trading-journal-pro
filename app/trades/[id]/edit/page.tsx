'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DynamicField from '@/components/DynamicField'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade, Field } from '@/lib/types'
import { loadFields } from '@/lib/fields'
import { loadTrade, deleteTrade } from '@/lib/trades'

export default function TradeDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)

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
      setTrade(tradeData)
      setFields(fieldsData)
      setLoading(false)
    }
    init()
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this trade?')) return
    await deleteTrade(id)
    router.push('/trades/history')
  }

  const tradeTitle = (() => {
    if (!trade) return 'Trade Detail'
    const pairField = fields.find(f => f.field_name.toLowerCase().includes('pair'))
    const dateField = fields.find(f => f.field_name.toLowerCase().includes('date'))
    const pair = pairField ? trade.data[pairField.field_name] : null
    const date = dateField ? trade.data[dateField.field_name] : null
    if (pair && date) return `${pair} — ${date}`
    if (pair) return pair
    return 'Trade Detail'
  })()

  const resultField = fields.find(f =>
    f.field_name.toLowerCase().includes('result') ||
    f.field_name.toLowerCase().includes('outcome')
  )
  const resultVal = resultField ? String(trade?.data[resultField.field_name] || '') : ''
  const isWin = resultVal.toLowerCase().includes('win')
  const isLoss = resultVal.toLowerCase().includes('loss')
  const resultColor = isWin ? '#34d399' : isLoss ? '#f87171' : '#fbbf24'
  const resultBg = isWin ? 'rgba(16,185,129,0.1)' : isLoss ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'

  // Get all screenshot URLs
  const screenshotUrls: string[] = (() => {
    if (!trade) return []
    if (Array.isArray(trade.data.screenshot_urls) && trade.data.screenshot_urls.length > 0) {
      return trade.data.screenshot_urls
    }
    if (trade.data.screenshot_url) return [trade.data.screenshot_url]
    return []
  })()

  // Fields to display — exclude screenshot fields
  const displayFields = fields.filter(f =>
    !f.field_name.toLowerCase().includes('screenshot')
  )

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{
          flex: 1, marginLeft: 0,
          paddingTop: '3.5rem', overflowY: 'auto', minHeight: '100vh',
        }}
          className="md:ml-56 md:pt-0"
        >
          <div style={{ padding: '1.5rem', maxWidth: '64rem', margin: '0 auto' }}>

            <Link href="/trades/history" style={{
              fontSize: '0.875rem', color: '#8888a0', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              marginBottom: '1.25rem',
            }}>
              ← Back to History
            </Link>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : !trade ? (
              <div style={{ textAlign: 'center', color: '#8888a0', padding: '3rem' }}>
                Trade not found.
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
                }}>
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem',
                    }}>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                        {tradeTitle}
                      </h1>
                      {resultVal && (
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '0.375rem',
                          fontSize: '0.875rem', fontWeight: 600,
                          backgroundColor: resultBg, color: resultColor,
                          border: `1px solid ${resultColor}30`,
                        }}>
                          {resultVal}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#555570' }}>
                      Logged {new Date(trade.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link
                      href={`/trades/${id}/edit`}
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="btn-danger"
                      style={{ fontSize: '0.875rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Screenshots */}
                {screenshotUrls.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: 500, color: '#555570',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      marginBottom: '0.75rem',
                    }}>
                      Chart Screenshots ({screenshotUrls.length})
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: screenshotUrls.length === 1
                        ? '1fr'
                        : 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '0.75rem',
                    }}>
                      {screenshotUrls.map((url, i) => (
                        <div key={url} style={{
                          borderRadius: '0.75rem', overflow: 'hidden',
                          border: '1px solid #1f1f2e',
                        }}>
                          <img
                            src={url}
                            alt={`Chart ${i + 1}`}
                            style={{
                              width: '100%',
                              height: screenshotUrls.length === 1 ? '400px' : '220px',
                              objectFit: 'cover', display: 'block',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All trade fields */}
                <div style={{
                  backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                  borderRadius: '0.75rem', padding: '1.25rem',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '1.25rem',
                  }}>
                    {displayFields.map(field => {
                      const val = trade.data[field.field_name]
                      if (val === null || val === undefined || val === '') return null
                      return (
                        <div
                          key={field.id}
                          style={{
                            gridColumn: field.field_type === 'textarea' ? '1 / -1' : undefined,
                          }}
                        >
                          <div style={{
                            fontSize: '0.7rem', fontWeight: 500, color: '#555570',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            marginBottom: '0.375rem',
                          }}>
                            {field.field_name}
                          </div>
                          <DynamicField
                            field={field}
                            value={val}
                            onChange={() => {}}
                            readOnly
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}