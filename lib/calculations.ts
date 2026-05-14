import { Trade, DashboardStats } from './types'

export function calculateRiskReward(entry: number, stopLoss: number, takeProfit: number): number {
  if (!entry || !stopLoss || !takeProfit) return 0
  const risk = Math.abs(entry - stopLoss)
  const reward = Math.abs(takeProfit - entry)
  if (risk === 0) return 0
  return Math.round((reward / risk) * 100) / 100
}

export function calculateDashboardStats(trades: Trade[]): DashboardStats {
  if (!trades.length) return {
    totalPL: 0, winRate: 0, totalTrades: 0, avgRR: 0,
    ruleFollowingPct: 0, totalWins: 0, totalLosses: 0,
    totalBreakeven: 0, bestTrade: null, worstTrade: null,
  }
  const totalPL = trades.reduce((s, t) => s + (t.profit_loss || 0), 0)
  const totalWins = trades.filter(t => t.result === 'Win').length
  const totalLosses = trades.filter(t => t.result === 'Loss').length
  const totalBreakeven = trades.filter(t => t.result === 'Breakeven').length
  const winRate = (totalWins / trades.length) * 100
  const avgRR = trades.reduce((s, t) => s + (t.risk_reward || 0), 0) / trades.length
  const ruleFollowingPct = (trades.filter(t => t.followed_rules).length / trades.length) * 100
  const sorted = [...trades].sort((a, b) => (a.profit_loss || 0) - (b.profit_loss || 0))
  return {
    totalPL: Math.round(totalPL * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    totalTrades: trades.length,
    avgRR: Math.round(avgRR * 100) / 100,
    ruleFollowingPct: Math.round(ruleFollowingPct * 10) / 10,
    totalWins, totalLosses, totalBreakeven,
    bestTrade: sorted[sorted.length - 1] || null,
    worstTrade: sorted[0] || null,
  }
}

export function getPairPerformance(trades: Trade[]) {
  const map: Record<string, { pl: number; count: number; wins: number }> = {}
  for (const t of trades) {
    if (!map[t.pair]) map[t.pair] = { pl: 0, count: 0, wins: 0 }
    map[t.pair].pl += t.profit_loss || 0
    map[t.pair].count++
    if (t.result === 'Win') map[t.pair].wins++
  }
  return Object.entries(map).map(([pair, d]) => ({
    pair, pl: Math.round(d.pl * 100) / 100, count: d.count,
    winRate: Math.round((d.wins / d.count) * 1000) / 10,
  })).sort((a, b) => b.pl - a.pl)
}

export function getSetupPerformance(trades: Trade[]) {
  const map: Record<string, { pl: number; count: number; wins: number }> = {}
  for (const t of trades) {
    const k = t.setup_type || 'Other'
    if (!map[k]) map[k] = { pl: 0, count: 0, wins: 0 }
    map[k].pl += t.profit_loss || 0
    map[k].count++
    if (t.result === 'Win') map[k].wins++
  }
  return Object.entries(map).map(([setup, d]) => ({
    setup, pl: Math.round(d.pl * 100) / 100, count: d.count,
    winRate: Math.round((d.wins / d.count) * 1000) / 10,
  })).sort((a, b) => b.pl - a.pl)
}

export function getMonthlyPerformance(trades: Trade[]) {
  const map: Record<string, { pl: number; count: number }> = {}
  for (const t of trades) {
    const month = t.trade_date?.slice(0, 7) || 'Unknown'
    if (!map[month]) map[month] = { pl: 0, count: 0 }
    map[month].pl += t.profit_loss || 0
    map[month].count++
  }
  return Object.entries(map).map(([month, d]) => ({
    month, pl: Math.round(d.pl * 100) / 100, count: d.count,
  })).sort((a, b) => a.month.localeCompare(b.month))
}

export function formatPL(value: number) {
  if (value > 0) return `+$${value.toFixed(2)}`
  if (value < 0) return `-$${Math.abs(value).toFixed(2)}`
  return '$0.00'
}