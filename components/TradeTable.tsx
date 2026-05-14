'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Trade } from '@/lib/types'
import { getSupabaseClient } from '@/lib/supabase'
import { formatPL } from '@/lib/calculations'

interface Props { trades: Trade[]; onRefresh: () => void }
type SortKey = 'trade_date' | 'profit_loss' | 'risk_reward'

export default function TradeTable({ trades, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [filterPair, setFilterPair] = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [filterSession, setFilterSession] = useState('')
  const [filterSetup, setFilterSetup] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('trade_date')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [deleting, setDeleting] = useState<string|null>(null)

  const pairs = useMemo(() => [...new Set(trades.map(t => t.pair))].sort(), [trades])
  const setups = useMemo(() => [...new Set(trades.map(t => t.setup_type))].sort(), [trades])

  const filtered = useMemo(() => trades
    .filter(t => {
      if (search && !`${t.pair} ${t.setup_type} ${t.session}`.toLowerCase().includes(search.toLowerCase())) return false
      if (filterPair && t.pair !== filterPair) return false
      if (filterResult && t.result !== filterResult) return false
      if (filterSession && t.session !== filterSession) return false
      if (filterSetup && t.setup_type !== filterSetup) return false
      if (dateFrom && t.trade_date < dateFrom) return false
      if (dateTo && t.trade_date > dateTo) return false
      return true
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? 0; const bv = b[sortKey] ?? 0
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    }), [trades, search, filterPair, filterResult, filterSession, filterSetup, dateFrom, dateTo, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this trade? Cannot be undone.')) return
    setDeleting(id)
    await getSupabaseClient().from('trades').delete().eq('id', id)
    setDeleting(null); onRefresh()
  }

  const SI = ({ k }: { k: SortKey }) => <span className="text-[#555570]">{sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <input type="text" className="form-input col-span-2 sm:col-span-1" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" value={filterPair} onChange={e => setFilterPair(e.target.value)}><option value="">All Pairs</option>{pairs.map(p => <option key={p}>{p}</option>)}</select>
        <select className="form-select" value={filterResult} onChange={e => setFilterResult(e.target.value)}><option value="">All Results</option>{['Win','Loss','Breakeven'].map(r => <option key={r}>{r}</option>)}</select>
        <select className="form-select" value={filterSession} onChange={e => setFilterSession(e.target.value)}><option value="">All Sessions</option>{['Asian','London','New York','London AM','New York AM','New York PM'].map(s => <option key={s}>{s}</option>)}</select>
        <select className="form-select" value={filterSetup} onChange={e => setFilterSetup(e.target.value)}><option value="">All Setups</option>{setups.map(s => <option key={s}>{s}</option>)}</select>
        <div className="flex gap-2 col-span-2 sm:col-span-1">
          <input type="date" className="form-input text-xs flex-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <input type="date" className="form-input text-xs flex-1" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>
      <div className="text-xs text-[#8888a0]">Showing <span className="text-white font-medium">{filtered.length}</span> of {trades.length} trades</div>
      <div className="card overflow-hidden overflow-x-auto">
        <table className="data-table w-full min-w-[700px]">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => toggleSort('trade_date')}>Date<SI k="trade_date" /></th>
              <th>Pair</th><th>Dir</th><th>Session</th><th>Setup</th><th>Result</th>
              <th className="cursor-pointer" onClick={() => toggleSort('profit_loss')}>P&L<SI k="profit_loss" /></th>
              <th className="cursor-pointer" onClick={() => toggleSort('risk_reward')}>R:R<SI k="risk_reward" /></th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-[#555570] py-12">No trades found.</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td className="num text-[#8888a0] text-xs">{t.trade_date}</td>
                <td className="font-semibold text-white">{t.pair}</td>
                <td><span className={t.direction === 'Buy' ? 'badge-buy' : 'badge-sell'}>{t.direction === 'Buy' ? '↑ Buy' : '↓ Sell'}</span></td>
                <td className="text-[#8888a0] text-xs">{t.session}</td>
                <td className="text-xs text-[#8888a0]">{t.setup_type}</td>
                <td><span className={t.result === 'Win' ? 'badge-win' : t.result === 'Loss' ? 'badge-loss' : 'badge-breakeven'}>{t.result}</span></td>
                <td className={`num font-semibold ${t.profit_loss > 0 ? 'text-emerald-400' : t.profit_loss < 0 ? 'text-red-400' : 'text-[#8888a0]'}`}>{formatPL(t.profit_loss)}</td>
                <td className="num text-[#8888a0]">{t.risk_reward ? `${t.risk_reward}R` : '—'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link href={`/trades/${t.id}`} className="text-xs text-blue-400 hover:text-blue-300 font-medium">View</Link>
                    <Link href={`/trades/${t.id}/edit`} className="text-xs text-[#8888a0] hover:text-white font-medium">Edit</Link>
                    <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="text-xs text-[#8888a0] hover:text-red-400 font-medium disabled:opacity-50">{deleting === t.id ? '…' : 'Delete'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}