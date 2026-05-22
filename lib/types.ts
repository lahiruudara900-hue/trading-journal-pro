// ============================================================
// FIELD TYPES
// ============================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'multiselect'
  | 'date'
  | 'checkbox'
  | 'textarea'

export interface Field {
  id: string
  user_id: string
  field_name: string
  field_type: FieldType
  field_options: string[]   // for dropdown / multiselect
  field_order: number
  created_at: string
}

export type FieldInsert = Omit<Field, 'id' | 'user_id' | 'created_at'>

// ============================================================
// TRADE TYPES
// ============================================================

// Trade data is fully flexible — any key/value pairs
export type TradeData = Record<string, any>

export interface Trade {
  id: string
  user_id: string
  data: TradeData
  created_at: string
  updated_at: string
}

export type TradeInsert = {
  user_id: string
  data: TradeData
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export interface DashboardStats {
  totalTrades: number
  totalPL: number
  winRate: number
  totalWins: number
  totalLosses: number
  totalBreakeven: number
  bestTrade: Trade | null
  worstTrade: Trade | null
}