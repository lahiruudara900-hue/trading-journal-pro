'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade } from '@/lib/types'
import { loadTrades } from '@/lib/trades'
import { calculateDashboardStats, getMonthlyPerformance, formatPL } from '@/lib/calculations'

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const data = await loadTrades(user.id)
      setTrades(data)
      setLoading(false)
    }
    load()
  }, [])

  const stats = calculateDashboardStats(trades)
  const monthly = getMonthlyPerformance(trades)
  const plColor = (v: number) => v > 0 ? '#00c980' : v < 0 ? '#ff4d6a' : '#5c6370'

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
    t.data?.['Pair'] || t.data?.['pair'] || t.data?.['Instrument'] || 'Trade'

  const getDate = (t: Trade) =>
    t.data?.['Trade Date'] || t.data?.['Date'] || new Date(t.created_at).toLocaleDateString()

  const resultBadge = (result: string) => {
    const r = result.toLowerCase()
    if (r.includes('win')) return <span className="badge badge-win">WIN</span>
    if (r.includes('loss')) return <span className="badge badge-loss">LOSS</span>
    if (r.includes('break') || r === 'be') return <span className="badge badge-be">BE</span>
    return <span className="badge badge-neutral">{result || '—'}</span>
  }

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px' }}>

            {/* Page header */}
            <div className="page-header">
              <div>
                <div className="page-title">Dashboard</div>
                <div className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <Link href="/trades/add" className="btn btn-primary">+ Log Trade</Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : trades.length === 0 ? (
              <div className="empty-state">
                <div className="es-icon">📈</div>
                <div className="es-text">No trades yet. Start by logging your first trade.</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                  <Link href="/premarket" className="btn btn-secondary">📋 Pre-Market Plan</Link>
                  <Link href="/trades/add" className="btn btn-primary">+ Log First Trade</Link>
                </div>
              </div>
            ) : (
              <>
                {/* Stat cards row 1 */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[
                    {
                      label: 'Total P&L',
                      value: formatPL(stats.totalPL),
                      cls: stats.totalPL > 0 ? 'pos' : stats.totalPL < 0 ? 'neg' : '',
                    },
                    {
                      label: 'Win Rate',
                      value: `${stats.winRate}%`,
                      cls: stats.winRate >= 50 ? 'pos' : 'neg',
                      sub: `${stats.totalWins}W / ${stats.totalLosses}L`,
                    },
                    {
                      label: 'Total Trades',
                      value: String(stats.totalTrades),
                      cls: '',
                    },
                    {
                      label: 'Wins',
                      value: String(stats.totalWins),
                      cls: 'pos',
                    },
                    {
                      label: 'Losses',
                      value: String(stats.totalLosses),
                      cls: 'neg',
                    },
                    {
                      label: 'Breakeven',
                      value: String(stats.totalBreakeven),
                      cls: '',
                    },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-label">{s.label}</div>
                      <div className={`stat-value ${s.cls}`}>{s.value}</div>
                      {s.sub && <div className="stat-sub">{s.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Best / Worst */}
                {(stats.bestTrade || stats.worstTrade) && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {stats.bestTrade && (
                      <Link href={`/trades/${stats.bestTrade.id}`} style={{
                        flex: 1, minWidth: '200px',
                        background: 'var(--bg2)', border: '1px solid rgba(0,201,128,0.15)',
                        borderRadius: 'var(--radius)', padding: '14px 16px',
                        textDecoration: 'none', display: 'block',
                        transition: 'border-color 0.15s',
                      }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>🏆 Best Trade</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 600, color: 'var(--green)' }}>
                          {formatPL(getPL(stats.bestTrade))}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>
                          {getPair(stats.bestTrade)} · {getDate(stats.bestTrade)}
                        </div>
                      </Link>
                    )}
                    {stats.worstTrade && (
                      <Link href={`/trades/${stats.worstTrade.id}`} style={{
                        flex: 1, minWidth: '200px',
                        background: 'var(--bg2)', border: '1px solid rgba(255,77,106,0.15)',
                        borderRadius: 'var(--radius)', padding: '14px 16px',
                        textDecoration: 'none', display: 'block',
                      }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>📉 Worst Trade</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 600, color: 'var(--red)' }}>
                          {formatPL(getPL(stats.worstTrade))}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>
                          {getPair(stats.worstTrade)} · {getDate(stats.worstTrade)}
                        </div>
                      </Link>
                    )}
                  </div>
                )}

                {/* Monthly P&L chart */}
                {monthly.length > 0 && (
                  <div className="card" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div className="section-title" style={{ margin: 0 }}>Monthly P&L</div>
                    </div>
                    <div style={{ height: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthly} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <XAxis dataKey="month" tick={{ fill: '#5c6370', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#5c6370', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: '4px', fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
                            labelStyle={{ color: 'var(--text)' }}
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          />
                          <Bar dataKey="pl" radius={[3, 3, 0, 0]}>
                            {monthly.map((e, i) => <Cell key={i} fill={plColor(e.pl)} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent trades table */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div className="section-title" style={{ margin: 0 }}>Recent Trades</div>
                    <Link href="/trades/history" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: '500px' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Pair</th>
                          <th>Result</th>
                          <th style={{ textAlign: 'right' }}>P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 8).map(t => {
                          const pl = getPL(t)
                          const result = getResult(t)
                          return (
                            <tr key={t.id} onClick={() => window.location.href = `/trades/${t.id}`}>
                              <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text3)' }}>{getDate(t)}</td>
                              <td style={{ fontWeight: 500 }}>{getPair(t)}</td>
                              <td>{result ? resultBadge(result) : '—'}</td>
                              <td style={{
                                textAlign: 'right',
                                fontFamily: 'var(--mono)', fontWeight: 600,
                                color: pl > 0 ? 'var(--green)' : pl < 0 ? 'var(--red)' : 'var(--text3)',
                              }}>
                                {formatPL(pl)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
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