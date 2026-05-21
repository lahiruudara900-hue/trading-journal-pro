'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade } from '@/lib/types'
import {
  calculateDashboardStats,
  getPairPerformance,
  getSetupPerformance,
  getMonthlyPerformance,
  formatPL,
} from '@/lib/calculations'

export default function PublicSharePage() {
  const params = useParams()
  const userId = params?.userId as string

  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [ownerEmail, setOwnerEmail] = useState<string>('')

  useEffect(() => {
    async function load() {
      if (!userId) { setNotFound(true); setLoading(false); return }
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: false })
      if (error || !data) { setNotFound(true); setLoading(false); return }
      setTrades(data)
      setLoading(false)
    }
    load()
  }, [userId])

  const stats = calculateDashboardStats(trades)
  const pairPerf = getPairPerformance(trades).slice(0, 8)
  const setupPerf = getSetupPerformance(trades)
  const monthly = getMonthlyPerformance(trades)
  const plColor = (v: number) => v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#8888a0'

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-white mb-2">Profile not found</h1>
        <p className="text-[#8888a0] text-sm">This trading journal doesn't exist or has been removed.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-[#1f1f2e] bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="font-semibold text-white">Trading Journal Pro</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#8888a0]">Public View — Read Only</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
          <p className="text-sm text-[#8888a0] mt-1">{stats.totalTrades} trades logged · View only</p>
        </div>

        {trades.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h2 className="text-lg font-semibold text-white mb-2">No trades yet</h2>
            <p className="text-[#8888a0] text-sm">This trader hasn't logged any trades yet.</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: 'Total P&L', value: formatPL(stats.totalPL), icon: '💰', color: stats.totalPL > 0 ? 'text-emerald-400' : stats.totalPL < 0 ? 'text-red-400' : 'text-white' },
                { title: 'Win Rate', value: `${stats.winRate}%`, icon: '🎯', color: stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400' },
                { title: 'Total Trades', value: String(stats.totalTrades), icon: '📊', color: 'text-white' },
                { title: 'Avg R:R', value: `${stats.avgRR}R`, icon: '⚖️', color: 'text-white' },
                { title: 'Rule Following', value: `${stats.ruleFollowingPct}%`, icon: '✅', color: stats.ruleFollowingPct >= 70 ? 'text-emerald-400' : 'text-amber-400' },
                { title: 'Wins', value: String(stats.totalWins), icon: '✅', color: 'text-emerald-400' },
                { title: 'Losses', value: String(stats.totalLosses), icon: '❌', color: 'text-red-400' },
                { title: 'Breakeven', value: String(stats.totalBreakeven), icon: '〰️', color: 'text-amber-400' },
              ].map((card) => (
                <div key={card.title} className="card p-4">
                  <div className="text-lg mb-1">{card.icon}</div>
                  <div className={`text-xl font-bold num ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-[#8888a0] mt-0.5">{card.title}</div>
                </div>
              ))}
            </div>

            {/* Best / Worst Trade */}
            {(stats.bestTrade || stats.worstTrade) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.bestTrade && (
                  <div className="card p-4 border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">🏆 Best Trade</div>
                    <div className="font-bold text-white">{stats.bestTrade.pair}</div>
                    <div className="text-emerald-400 num text-lg font-bold">{formatPL(stats.bestTrade.profit_loss)}</div>
                    <div className="text-xs text-[#8888a0]">{stats.bestTrade.trade_date} · {stats.bestTrade.setup_type}</div>
                  </div>
                )}
                {stats.worstTrade && (
                  <div className="card p-4 border border-red-500/20">
                    <div className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">📉 Worst Trade</div>
                    <div className="font-bold text-white">{stats.worstTrade.pair}</div>
                    <div className="text-red-400 num text-lg font-bold">{formatPL(stats.worstTrade.profit_loss)}</div>
                    <div className="text-xs text-[#8888a0]">{stats.worstTrade.trade_date} · {stats.worstTrade.setup_type}</div>
                  </div>
                )}
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {monthly.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Monthly P&L</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthly}>
                      <XAxis dataKey="month" tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#16161f', border: '1px solid #1f1f2e', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="pl" radius={[4, 4, 0, 0]}>{monthly.map((e, i) => <Cell key={i} fill={plColor(e.pl)} />)}</Bar>
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
                      <Bar dataKey="pl" radius={[0, 4, 4, 0]}>{pairPerf.map((e, i) => <Cell key={i} fill={plColor(e.pl)} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Setup Performance */}
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

            {/* Full Trade Table */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">All Trades ({trades.length})</h3>
              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[700px]">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pair</th>
                      <th>Session</th>
                      <th>Direction</th>
                      <th>Setup</th>
                      <th>Result</th>
                      <th>R:R</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => (
                      <tr key={t.id}>
                        <td className="text-[#8888a0] text-xs">{t.trade_date}</td>
                        <td className="font-semibold text-white">{t.pair}</td>
                        <td className="text-[#8888a0] text-xs">{t.session}</td>
                        <td>
                          <span className={`text-xs font-medium ${t.direction === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {t.direction === 'Buy' ? '▲' : '▼'} {t.direction}
                          </span>
                        </td>
                        <td className="text-[#8888a0] text-xs">{t.setup_type}</td>
                        <td>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            t.result === 'Win' ? 'bg-emerald-500/10 text-emerald-400' :
                            t.result === 'Loss' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>{t.result}</span>
                        </td>
                        <td className="num text-[#8888a0]">{t.risk_reward}R</td>
                        <td className={`num font-semibold ${t.profit_loss > 0 ? 'text-emerald-400' : t.profit_loss < 0 ? 'text-red-400' : 'text-[#8888a0]'}`}>
                          {formatPL(t.profit_loss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-xs text-[#555570]">
          Powered by <span className="text-blue-400">Trading Journal Pro</span> · Read-only public view
        </div>
      </main>
    </div>
  )
}
