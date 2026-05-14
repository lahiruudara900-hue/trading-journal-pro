export type Session = 'Asian' | 'London' | 'New York' | 'London AM' | 'New York AM' | 'New York PM'
export type Direction = 'Buy' | 'Sell'
export type Result = 'Win' | 'Loss' | 'Breakeven'
export type Bias = 'Bullish' | 'Bearish' | 'Neutral'
export type SetupType = 'Silver Bullet' | 'FVG' | 'OTE' | 'SMT Divergence' | 'Liquidity Sweep' | 'Breaker' | 'Order Block' | 'Other'
export type LiquidityTaken = 'PDH' | 'PDL' | 'Asian High' | 'Asian Low' | 'Equal Highs' | 'Equal Lows' | 'Previous Week High' | 'Previous Week Low' | 'None'
export type PointOfInterest = 'FVG' | 'Order Block' | 'Breaker' | 'Mitigation Block' | 'Premium Zone' | 'Discount Zone' | 'Other'

export interface Trade {
  id: string
  user_id: string
  trade_date: string
  pair: string
  session: Session
  direction: Direction
  entry_price: number
  stop_loss: number
  take_profit: number
  risk_percent: number
  risk_amount: number
  risk_reward: number
  result: Result
  profit_loss: number
  setup_type: SetupType
  bias: Bias
  liquidity_taken: LiquidityTaken
  point_of_interest: PointOfInterest
  followed_rules: boolean
  rule_following_score: number
  emotion: string
  mistake: string
  lesson: string
  notes: string
  screenshot_url: string | null
  created_at: string
  updated_at: string
}

export type TradeInsert = Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export interface DashboardStats {
  totalPL: number
  winRate: number
  totalTrades: number
  avgRR: number
  ruleFollowingPct: number
  totalWins: number
  totalLosses: number
  totalBreakeven: number
  bestTrade: Trade | null
  worstTrade: Trade | null
}