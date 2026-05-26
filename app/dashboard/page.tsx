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
  const plColor = (v: number) => v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#8888a0'

  const StatCard = ({ title, value, color, icon }: {
    title: string; value: string; color?: string; icon: string
  }) => (
    <div style={{
      backgroundColor: '#16161f', border: '1px solid #1f1f2e',
      borderRadius: '0.75rem', padding: '1rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <span style={{ fontSize: '1.125rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: color || 'white' }}>{value}</div>
    </div>
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
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>Dashboard</h1>
                <p style={{ fontSize: '0.875rem', color: '#8888a0' }}>Your trading performance overview</p>
              </div>
              <Link href="/trades/add" className="btn-primary" style={{ fontSize: '0.875rem' }}>+ Add Trade</Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : trades.length === 0 ? (
              <div style={{
                backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>No trades yet</h2>
                <p style={{ fontSize: '0.875rem', color: '#8888a0', marginBottom: '1.25rem' }}>
                  Start by setting up your fields, then log your first trade.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/fields" className="btn-secondary">🧩 Set Up Fields</Link>
                  <Link href="/trades/add" className="btn-primary">+ Log First Trade</Link>
                </div>
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}>
                  <StatCard
                    title="Total P&L"
                    value={formatPL(stats.totalPL)}
                    color={stats.totalPL > 0 ? '#10b981' : stats.totalPL < 0 ? '#ef4444' : undefined}
                    icon="💰"
                  />
                  <StatCard
                    title="Win Rate"
                    value={`${stats.winRate}%`}
                    color={stats.winRate >= 50 ? '#10b981' : '#ef4444'}
                    icon="🎯"
                  />
                  <StatCard title="Total Trades" value={String(stats.totalTrades)} icon="📊" />
                  <StatCard title="Wins" value={String(stats.totalWins)} color="#10b981" icon="✅" />
                  <StatCard title="Losses" value={String(stats.totalLosses)} color="#ef4444" icon="❌" />
                  <StatCard title="Breakeven" value={String(stats.totalBreakeven)} color="#f59e0b" icon="〰️" />
                </div>

                {/* Best / Worst */}
                {(stats.bestTrade || stats.worstTrade) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {stats.bestTrade && (
                      <Link href={`/trades/${stats.bestTrade.id}`} style={{
                        backgroundColor: '#16161f', border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '0.75rem', padding: '1rem', textDecoration: 'none', display: 'block',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500, marginBottom: '0.25rem' }}>🏆 Best Trade</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                          {formatPL((() => {
                            const keys = ['Profit / Loss ($)', 'profit_loss', 'PL']
                            for (const k of keys) { if (stats.bestTrade!.data[k] !== undefined) return parseFloat(stats.bestTrade!.data[k]) || 0 }
                            return 0
                          })())}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555570', marginTop: '0.25rem' }}>
                          {new Date(stats.bestTrade.created_at).toLocaleDateString()}
                        </div>
                      </Link>
                    )}
                    {stats.worstTrade && (
                      <Link href={`/trades/${stats.worstTrade.id}`} style={{
                        backgroundColor: '#16161f', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '0.75rem', padding: '1rem', textDecoration: 'none', display: 'block',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500, marginBottom: '0.25rem' }}>📉 Worst Trade</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                          {formatPL((() => {
                            const keys = ['Profit / Loss ($)', 'profit_loss', 'PL']
                            for (const k of keys) { if (stats.worstTrade!.data[k] !== undefined) return parseFloat(stats.worstTrade!.data[k]) || 0 }
                            return 0
                          })())}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555570', marginTop: '0.25rem' }}>
                          {new Date(stats.worstTrade.created_at).toLocaleDateString()}
                        </div>
                      </Link>
                    )}
                  </div>
                )}

                {/* Monthly chart */}
                {monthly.length > 0 && (
                  <div style={{
                    backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                    borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>Monthly P&L</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthly}>
                        <XAxis dataKey="month" tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#16161f', border: '1px solid #1f1f2e', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                          {monthly.map((e, i) => <Cell key={i} fill={plColor(e.pl)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent trades */}
                <div style={{
                  backgroundColor: '#16161f', border: '1px solid #1f1f2e',
                  borderRadius: '0.75rem', padding: '1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Recent Trades</h3>
                    <Link href="/trades/history" style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}>View all →</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {trades.slice(0, 5).map(t => {
                      const plVal = (() => {
                        const keys = ['Profit / Loss ($)', 'profit_loss', 'PL', 'P&L']
                        for (const k of keys) { if (t.data[k] !== undefined) return parseFloat(t.data[k]) || 0 }
                        return 0
                      })()
                      const resultVal = t.data['Result'] || t.data['result'] || ''
                      const isWin = String(resultVal).toLowerCase().includes('win')
                      const isLoss = String(resultVal).toLowerCase().includes('loss')
                      const barColor = isWin ? '#10b981' : isLoss ? '#ef4444' : '#f59e0b'
                      const pair = t.data['Pair'] || t.data['pair'] || 'Trade'
                      const date = t.data['Trade Date'] || t.data['Date'] || new Date(t.created_at).toLocaleDateString()

                      return (
                        <Link key={t.id} href={`/trades/${t.id}`} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
                          textDecoration: 'none', transition: 'background 0.15s',
                        }}
                          onMouseOver={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1e1e2a'}
                          onMouseOut={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: '0.25rem', height: '2rem', borderRadius: '9999px', backgroundColor: barColor, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{pair}</div>
                            <div style={{ fontSize: '0.75rem', color: '#8888a0' }}>{date}</div>
                          </div>
                          <div style={{
                            fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace',
                            color: plVal > 0 ? '#10b981' : plVal < 0 ? '#ef4444' : '#8888a0',
                          }}>
                            {formatPL(plVal)}
                          </div>
                        </Link>
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