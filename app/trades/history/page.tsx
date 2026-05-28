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
import { formatPL } from '@/lib/calculations'

type Period = 'Today' | 'Week' | 'Month' | 'Year' | 'All'

export default function HistoryPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<Period>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const getPL = (t: Trade) => {
    const keys = ['Profit / Loss ($)', 'profit_loss', 'PL', 'P&L']
    for (const k of keys) {
      if (t.data?.[k] !== undefined) return parseFloat(t.data[k]) || 0
    }
    return 0
  }

  const getResult = (t: Trade) => {
    const keys = ['Result', 'result', 'Outcome']
    for (const k of keys) { if (t.data?.[k]) return String(t.data[k]) }
    return ''
  }

  const getPair = (t: Trade) =>
    t.data?.['Pair'] || t.data?.['pair'] || t.data?.['Instrument'] || '—'

  const getDate = (t: Trade) =>
    t.data?.['Trade Date'] || t.data?.['Date'] || t.created_at?.slice(0, 10) || '—'

  const getSession = (t: Trade) =>
    t.data?.['Session'] || t.data?.['session'] || '—'

  const getSetup = (t: Trade) =>
    t.data?.['Setup Type'] || t.data?.['setup_type'] || t.data?.['Model'] || '—'

  const getRR = (t: Trade) =>
    t.data?.['R:R Ratio'] || t.data?.['RR'] || t.data?.['risk_reward'] || '—'

  // Period filter
  const now = new Date()
  const filtered = useMemo(() => {
    return trades.filter(t => {
      // Period
      const dateStr = getDate(t)
      const d = new Date(dateStr)
      if (period === 'Today') {
        if (d.toDateString() !== now.toDateString()) return false
      } else if (period === 'Week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
        if (d < weekAgo) return false
      } else if (period === 'Month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false
      } else if (period === 'Year') {
        if (d.getFullYear() !== now.getFullYear()) return false
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchable = Object.values(t.data || {}).map(v => String(v).toLowerCase()).join(' ')
        if (!matchable.includes(q)) return false
      }
      return true
    })
  }, [trades, period, search])

  // Summary stats for filtered trades
  const filteredPL = filtered.reduce((s, t) => s + getPL(t), 0)
  const filteredWins = filtered.filter(t => getResult(t).toLowerCase().includes('win')).length
  const filteredLosses = filtered.filter(t => getResult(t).toLowerCase().includes('loss')).length
  const winRate = filtered.length > 0 ? Math.round((filteredWins / filtered.length) * 100) : 0

  async function handleDelete(id: string) {
    if (!confirm('Delete this trade? This cannot be undone.')) return
    setDeleting(id)
    await deleteTrade(id)
    setTrades(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  const resultBadge = (result: string) => {
    const r = result.toLowerCase()
    if (r.includes('win')) return <span className="badge badge-win">WIN</span>
    if (r.includes('loss')) return <span className="badge badge-loss">LOSS</span>
    if (r.includes('break') || r === 'be') return <span className="badge badge-be">BE</span>
    return <span className="badge badge-neutral">{result}</span>
  }

  // Non-screenshot, non-textarea fields for expanded detail
  const detailFields = fields.filter(f =>
    f.field_type !== 'screenshot' &&
    f.field_type !== 'textarea'
  )
  const screenshotFields = fields.filter(f => f.field_type === 'screenshot')
  const textareaFields = fields.filter(f => f.field_type === 'textarea')

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px' }}>

            {/* Header */}
            <div className="page-header">
              <div>
                <div className="page-title">Trade History</div>
                <div className="page-subtitle">All your logged trades</div>
              </div>
              <Link href="/trades/add" className="btn btn-primary">+ Log Trade</Link>
            </div>

            {/* Period filter */}
            <div className="filter-bar">
              {(['Today', 'Week', 'Month', 'Year', 'All'] as Period[]).map(p => (
                <button
                  key={p}
                  className={`filter-btn ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >{p}</button>
              ))}
              <input
                type="text"
                className="form-input"
                style={{ maxWidth: '180px', padding: '5px 11px', fontSize: '12.5px' }}
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : trades.length === 0 ? (
              <div className="empty-state">
                <div className="es-icon">📊</div>
                <div className="es-text">No trades yet.</div>
                <Link href="/trades/add" className="btn btn-primary" style={{ marginTop: '16px' }}>Log Your First Trade</Link>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Trades', value: String(filtered.length) },
                    { label: 'P&L', value: formatPL(filteredPL), color: filteredPL > 0 ? 'var(--green)' : filteredPL < 0 ? 'var(--red)' : undefined },
                    { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' },
                    { label: 'Wins', value: String(filteredWins), color: 'var(--green)' },
                    { label: 'Losses', value: String(filteredLosses), color: 'var(--red)' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '10px 14px',
                      minWidth: '90px',
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '15px', color: s.color || 'var(--text)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Count */}
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>
                  Showing <strong style={{ color: 'var(--text2)' }}>{filtered.length}</strong> of {trades.length} trades
                </div>

                {filtered.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="es-text">No trades match your filter.</div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ minWidth: '600px' }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Pair</th>
                            <th>Session</th>
                            <th>Setup</th>
                            <th>Result</th>
                            <th>R:R</th>
                            <th style={{ textAlign: 'right' }}>P&L</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(trade => {
                            const pl = getPL(trade)
                            const result = getResult(trade)
                            const isExpanded = expandedId === trade.id

                            return (
                              <>
                                {/* Main row */}
                                <tr
                                  key={trade.id}
                                  onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text3)' }}>
                                    {getDate(trade)}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>{getPair(trade)}</td>
                                  <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{getSession(trade)}</td>
                                  <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{getSetup(trade)}</td>
                                  <td>{result ? resultBadge(result) : '—'}</td>
                                  <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text2)' }}>
                                    {getRR(trade)}
                                  </td>
                                  <td style={{
                                    textAlign: 'right',
                                    fontFamily: 'var(--mono)', fontWeight: 600,
                                    color: pl > 0 ? 'var(--green)' : pl < 0 ? 'var(--red)' : 'var(--text3)',
                                  }}>
                                    {formatPL(pl)}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                                      <Link
                                        href={`/trades/${trade.id}`}
                                        className="btn btn-ghost btn-sm"
                                        style={{ fontSize: '11.5px' }}
                                      >View</Link>
                                      <Link
                                        href={`/trades/${trade.id}/edit`}
                                        className="btn btn-ghost btn-sm"
                                        style={{ fontSize: '11.5px' }}
                                      >Edit</Link>
                                      <button
                                        onClick={() => handleDelete(trade.id)}
                                        disabled={deleting === trade.id}
                                        className="btn btn-danger btn-sm"
                                        style={{ fontSize: '11.5px' }}
                                      >
                                        {deleting === trade.id ? '…' : 'Del'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded detail row */}
                                {isExpanded && (
                                  <tr key={`${trade.id}-detail`}>
                                    <td colSpan={8} style={{ padding: 0, background: 'var(--bg3)' }}>
                                      <div style={{ padding: '16px 20px' }}>

                                        {/* Detail grid */}
                                        <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                          gap: '12px',
                                          marginBottom: '12px',
                                        }}>
                                          {detailFields.map(field => {
                                            const val = trade.data[field.field_name]
                                            if (val === null || val === undefined || val === '') return null
                                            return (
                                              <div key={field.id}>
                                                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: '3px' }}>
                                                  {field.field_name}
                                                </div>
                                                <div style={{ fontSize: '13px', fontFamily: field.field_type === 'number' ? 'var(--mono)' : 'inherit', color: 'var(--text)' }}>
                                                  {field.field_type === 'checkbox'
                                                    ? (val ? '✅ Yes' : '❌ No')
                                                    : Array.isArray(val) ? val.join(', ')
                                                    : String(val)}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>

                                        {/* Textarea fields */}
                                        {textareaFields.map(field => {
                                          const val = trade.data[field.field_name]
                                          if (!val) return null
                                          return (
                                            <div key={field.id} style={{ marginBottom: '10px' }}>
                                              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: '4px' }}>
                                                {field.field_name}
                                              </div>
                                              <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {String(val)}
                                              </div>
                                            </div>
                                          )
                                        })}

                                        {/* Screenshots */}
                                        {screenshotFields.map(field => {
                                          const urls = Array.isArray(trade.data[field.field_name])
                                            ? trade.data[field.field_name]
                                            : trade.data[field.field_name] ? [trade.data[field.field_name]] : []
                                          if (!urls.length) return null
                                          return (
                                            <div key={field.id} style={{ marginTop: '8px' }}>
                                              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: '6px' }}>
                                                {field.field_name}
                                              </div>
                                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {urls.map((url: string, i: number) => (
                                                  <img
                                                    key={i}
                                                    src={url}
                                                    alt={`Screenshot ${i + 1}`}
                                                    style={{ width: '120px', height: '75px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer' }}
                                                    onClick={() => window.open(url, '_blank')}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        })}

                                        {/* Quick actions */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                                          <Link href={`/trades/${trade.id}`} className="btn btn-secondary btn-sm">View Full Detail</Link>
                                          <Link href={`/trades/${trade.id}/edit`} className="btn btn-ghost btn-sm">Edit Trade</Link>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}