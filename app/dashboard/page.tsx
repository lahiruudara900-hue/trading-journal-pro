'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DashboardCard from '@/components/DashboardCard'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade } from '@/lib/types'
import { calculateDashboardStats, getPairPerformance, getSetupPerformance, getMonthlyPerformance, formatPL } from '@/lib/calculations'

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('trade_date', { ascending: false })
      setTrades(data || []); setLoading(false)
    }
    load()
  }, [])

  const stats = calculateDashboardStats(trades)
  const pairPerf = getPairPerformance(trades).slice(0, 8)
  const setupPerf = getSetupPerformance(trades)
  const monthly = getMonthlyPerformance(trades)
  const plColor = (v: number) => v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#8888a0'

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className="text-xl font-bold text-white">Dashboard</h1><p className="text-sm text-[#8888a0]">Your trading performance overview</p></div>
              <Link href="/trades/add" className="btn-primary text-sm">+ Add Trade</Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : trades.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-4xl mb-4">📈</div>
                <h2 className="text-lg font-semibold text-white mb-2">No trades yet</h2>
                <p className="text-[#8888a0] text-sm mb-4">Start logging your trades to see performance insights.</p>
                <Link href="/trades/add" className="btn-primary">Log Your First Trade</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <DashboardCard title="Total P&L" value={formatPL(stats.totalPL)} color={stats.totalPL > 0 ? 'profit' : stats.totalPL < 0 ? 'loss' : 'default'} icon="💰" />
                  <DashboardCard title="Win Rate" value={`${stats.winRate}%`} icon="🎯" color={stats.winRate >= 50 ? 'profit' : 'loss'} />
                  <DashboardCard title="Total Trades" value={String(stats.totalTrades)} icon="📊" />
                  <DashboardCard title="Avg R:R" value={`${stats.avgRR}R`} icon="⚖️" />
                  <DashboardCard title="Rule Following" value={`${stats.ruleFollowingPct}%`} icon="✅" color={stats.ruleFollowingPct >= 70 ? 'profit' : 'neutral'} />
                  <DashboardCard title="Wins" value={String(stats.totalWins)} color="profit" icon="✅" />
                  <DashboardCard title="Losses" value={String(stats.totalLosses)} color="loss" icon="❌" />
                  <DashboardCard title="Breakeven" value={String(stats.totalBreakeven)} color="neutral" icon="〰️" />
                </div>

                {(stats.bestTrade || stats.worstTrade) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stats.bestTrade && (
                      <Link href={`/trades/${stats.bestTrade.id}`} className="card p-4 card-glow border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                        <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">🏆 Best Trade</div>
                        <div className="font-bold text-white">{stats.bestTrade.pair}</div>
                        <div className="text-emerald-400 num text-lg font-bold">{formatPL(stats.bestTrade.profit_loss)}</div>
                        <div className="text-xs text-[#8888a0]">{stats.bestTrade.trade_date} · {stats.bestTrade.setup_type}</div>
                      </Link>
                    )}
                    {stats.worstTrade && (
                      <Link href={`/trades/${stats.worstTrade.id}`} className="card p-4 card-glow border-red-500/20 hover:border-red-500/40 transition-colors">
                        <div className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">📉 Worst Trade</div>
                        <div className="font-bold text-white">{stats.worstTrade.pair}</div>
                        <div className="text-red-400 num text-lg font-bold">{formatPL(stats.worstTrade.profit_loss)}</div>
                        <div className="text-xs text-[#8888a0]">{stats.worstTrade.trade_date} · {stats.worstTrade.setup_type}</div>
                      </Link>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {monthly.length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">Monthly P&L</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthly}>
                          <XAxis dataKey="month" tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#16161f', border: '1px solid #1f1f2e', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="pl" radius={[4,4,0,0]}>{monthly.map((e,i) => <Cell key={i} fill={plColor(e.pl)} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {pairPerf.length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">Performance by Pair</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={pairPerf} layout="vertical">
                          <XAxis type="number" tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="pair" type="category" tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#16161f', border: '1px solid #1f1f2e', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="pl" radius={[0,4,4,0]}>{pairPerf.map((e,i) => <Cell key={i} fill={plColor(e.pl)} />)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {setupPerf.length > 0 && (
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Performance by Setup</h3>
                    <div className="overflow-x-auto">
                      <table className="data-table w-full min-w-[400px]">
                        <thead><tr><th>Setup</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th></tr></thead>
                        <tbody>
                          {setupPerf.map(s => (
                            <tr key={s.setup}>
                              <td className="font-medium text-white">{s.setup}</td>
                              <td className="text-[#8888a0]">{s.count}</td>
                              <td className={s.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>{s.winRate}%</td>
                              <td className={`num font-semibold ${s.pl > 0 ? 'text-emerald-400' : s.pl < 0 ? 'text-red-400' : 'text-[#8888a0]'}`}>{formatPL(s.pl)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Recent Trades</h3>
                    <Link href="/trades/history" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
                  </div>
                  <div className="space-y-2">
                    {trades.slice(0,5).map(t => (
                      <Link key={t.id} href={`/trades/${t.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#1e1e2a] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-8 rounded-full ${t.result === 'Win' ? 'bg-emerald-500' : t.result === 'Loss' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <div>
                            <div className="text-sm font-semibold text-white">{t.pair}</div>
                            <div className="text-xs text-[#8888a0]">{t.trade_date} · {t.session}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`num font-semibold text-sm ${t.profit_loss > 0 ? 'text-emerald-400' : t.profit_loss < 0 ? 'text-red-400' : 'text-[#8888a0]'}`}>{formatPL(t.profit_loss)}</div>
                          <div className="text-xs text-[#555570]">{t.setup_type}</div>
                        </div>
                      </Link>
                    ))}
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