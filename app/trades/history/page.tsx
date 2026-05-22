'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade, Field } from '@/lib/types'
import { loadFields } from '@/lib/fields'
import { loadTrades, deleteTrade } from '@/lib/trades'

export default function HistoryPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [tradesData, fieldsData] = await Promise.all([
      loadTrades(user.id),
      loadFields(user.id),
    ])
    setTrades(tradesData)
    setFields(fieldsData)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Show first 5 fields as columns (skip textarea)
  const columnFields = useMemo(() =>
    fields.filter(f => f.field_type !== 'textarea').slice(0, 6),
    [fields]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return trades
    const q = search.toLowerCase()
    return trades.filter(t =>
      Object.values(t.data || {}).some(v =>
        String(v).toLowerCase().includes(q)
      )
    )
  }, [trades, search])

  async function handleDelete(id: string) {
    if (!confirm('Delete this trade? This cannot be undone.')) return
    setDeleting(id)
    await deleteTrade(id)
    setTrades(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  const formatVal = (val: any, fieldType: string): string => {
    if (val === null || val === undefined || val === '') return '—'
    if (fieldType === 'checkbox') return val ? '✅' : '❌'
    if (Array.isArray(val)) return val.join(', ')
    return String(val)
  }

  // Try to find a P&L-style field for coloring
  const plField = fields.find(f =>
    f.field_name.toLowerCase().includes('profit') ||
    f.field_name.toLowerCase().includes('p&l') ||
    f.field_name.toLowerCase().includes('pl')
  )

  const resultField = fields.find(f =>
    f.field_name.toLowerCase().includes('result') ||
    f.field_name.toLowerCase().includes('outcome')
  )

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div style={{ padding: '1.5rem', maxWidth: '80rem', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>Trade History</h1>
                <p style={{ fontSize: '0.875rem', color: '#8888a0' }}>All your logged trades.</p>
              </div>
              <Link href="/trades/add" className="btn-primary" style={{ fontSize: '0.875rem' }}>+ Add Trade</Link>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ maxWidth: '20rem' }}
                placeholder="Search trades…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Count */}
            {!loading && (
              <div style={{ fontSize: '0.75rem', color: '#555570', marginBottom: '0.75rem' }}>
                Showing <strong style={{ color: 'white' }}>{filtered.length}</strong> of {trades.length} trades
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : trades.length === 0 ? (
              <div style={{
                backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>No trades yet</h2>
                <Link href="/trades/add" className="btn-primary">Log Your First Trade</Link>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                borderRadius: '0.75rem', overflow: 'hidden', overflowX: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      {columnFields.map(f => (
                        <th key={f.id} style={{
                          padding: '0.75rem 1rem', textAlign: 'left',
                          fontSize: '0.75rem', fontWeight: 500,
                          color: '#8888a0', textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #1f1f2e',
                          backgroundColor: '#111118',
                        }}>
                          {f.field_name}
                        </th>
                      ))}
                      <th style={{
                        padding: '0.75rem 1rem', textAlign: 'left',
                        fontSize: '0.75rem', fontWeight: 500,
                        color: '#8888a0', textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #1f1f2e',
                        backgroundColor: '#111118',
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(trade => {
                      const plVal = plField ? parseFloat(trade.data[plField.field_name]) || 0 : 0
                      const resultVal = resultField ? String(trade.data[resultField.field_name] || '') : ''
                      const isWin = resultVal.toLowerCase().includes('win')
                      const isLoss = resultVal.toLowerCase().includes('loss')

                      return (
                        <tr
                          key={trade.id}
                          style={{ borderBottom: '1px solid rgba(31,31,46,0.5)', cursor: 'pointer' }}
                          onMouseOver={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#1e1e2a'}
                          onMouseOut={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                        >
                          {columnFields.map(f => {
                            const val = trade.data[f.field_name]
                            const isPL = plField && f.id === plField.id
                            const isResult = resultField && f.id === resultField.id

                            let color = '#e8e8f0'
                            if (isPL) {
                              color = plVal > 0 ? '#34d399' : plVal < 0 ? '#f87171' : '#8888a0'
                            }
                            if (isResult) {
                              color = isWin ? '#34d399' : isLoss ? '#f87171' : '#fbbf24'
                            }

                            return (
                              <td key={f.id} style={{
                                padding: '0.75rem 1rem', fontSize: '0.875rem',
                                color, fontFamily: f.field_type === 'number' ? 'monospace' : 'inherit',
                                fontWeight: isPL ? 600 : 400,
                              }}>
                                {formatVal(val, f.field_type)}
                              </td>
                            )
                          })}
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <Link
                                href={`/trades/${trade.id}`}
                                style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 500, textDecoration: 'none' }}
                              >View</Link>
                              <Link
                                href={`/trades/${trade.id}/edit`}
                                style={{ fontSize: '0.75rem', color: '#8888a0', fontWeight: 500, textDecoration: 'none' }}
                              >Edit</Link>
                              <button
                                onClick={() => handleDelete(trade.id)}
                                disabled={deleting === trade.id}
                                style={{
                                  fontSize: '0.75rem', color: '#8888a0', fontWeight: 500,
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  padding: 0, opacity: deleting === trade.id ? 0.5 : 1,
                                }}
                                onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.color = '#f87171'}
                                onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.color = '#8888a0'}
                              >
                                {deleting === trade.id ? '…' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}