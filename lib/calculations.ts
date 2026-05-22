import { Trade, DashboardStats, Field } from './types'

// ============================================================
// Get a field value from trade data safely
// ============================================================
export function getFieldValue(trade: Trade, fieldName: string): any {
  return trade.data?.[fieldName] ?? null
}

// ============================================================
// Find a field by name from fields list
// ============================================================
export function findField(fields: Field[], name: string): Field | undefined {
  return fields.find(f => f.field_name === name)
}

// ============================================================
// Calculate R:R automatically
// ============================================================
export function calculateRR(entry: number, sl: number, tp: number): number {
  if (!entry || !sl || !tp) return 0
  const risk = Math.abs(entry - sl)
  const reward = Math.abs(tp - entry)
  if (risk === 0) return 0
  return Math.round((reward / risk) * 100) / 100
}

// ============================================================
// Format currency
// ============================================================
export function formatPL(value: number): string {
  if (!value && value !== 0) return '—'
  if (value > 0) return `+$${value.toFixed(2)}`
  if (value < 0) return `-$${Math.abs(value).toFixed(2)}`
  return '$0.00'
}

// ============================================================
// Dashboard stats from trades_v2
// ============================================================
export function calculateDashboardStats(trades: Trade[]): DashboardStats {
  if (!trades.length) return {
    totalTrades: 0, totalPL: 0, winRate: 0,
    totalWins: 0, totalLosses: 0, totalBreakeven: 0,
    bestTrade: null, worstTrade: null,
  }

  // Try to find P&L from common field names
  const getPL = (t: Trade): number => {
    const keys = ['Profit / Loss ($)', 'profit_loss', 'PL', 'P&L', 'Profit/Loss']
    for (const k of keys) {
      const v = t.data?.[k]
      if (v !== undefined && v !== null && v !== '') return parseFloat(v) || 0
    }
    return 0
  }

  const getResult = (t: Trade): string => {
    const keys = ['Result', 'result', 'Outcome']
    for (const k of keys) {
      if (t.data?.[k]) return t.data[k]
    }
    return ''
  }

  const totalPL = trades.reduce((s, t) => s + getPL(t), 0)
  const totalWins = trades.filter(t => getResult(t).toLowerCase().includes('win')).length
  const totalLosses = trades.filter(t => getResult(t).toLowerCase().includes('loss')).length
  const totalBreakeven = trades.filter(t =>
    getResult(t).toLowerCase().includes('break') ||
    getResult(t).toLowerCase() === 'be'
  ).length
  const winRate = trades.length > 0 ? (totalWins / trades.length) * 100 : 0

  const sorted = [...trades].sort((a, b) => getPL(a) - getPL(b))

  return {
    totalTrades: trades.length,
    totalPL: Math.round(totalPL * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    totalWins,
    totalLosses,
    totalBreakeven,
    bestTrade: sorted[sorted.length - 1] || null,
    worstTrade: sorted[0] || null,
  }
}

// ============================================================
// Monthly performance
// ============================================================
export function getMonthlyPerformance(trades: Trade[]) {
  const map: Record<string, { pl: number; count: number }> = {}

  for (const t of trades) {
    // Try to get date from common field names
    const dateVal =
      t.data?.['Trade Date'] ||
      t.data?.['Date'] ||
      t.data?.['trade_date'] ||
      t.created_at

    const month = dateVal ? String(dateVal).slice(0, 7) : 'Unknown'

    const pl = (() => {
      const keys = ['Profit / Loss ($)', 'profit_loss', 'PL', 'P&L']
      for (const k of keys) {
        if (t.data?.[k] !== undefined) return parseFloat(t.data[k]) || 0
      }
      return 0
    })()

    if (!map[month]) map[month] = { pl: 0, count: 0 }
    map[month].pl += pl
    map[month].count++
  }

  return Object.entries(map)
    .map(([month, d]) => ({
      month,
      pl: Math.round(d.pl * 100) / 100,
      count: d.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}