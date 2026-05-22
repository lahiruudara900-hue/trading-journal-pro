import { getSupabaseClient } from './supabase'
import { Trade, TradeData } from './types'

// ============================================================
// Load all trades for a user (newest first)
// ============================================================
export async function loadTrades(userId: string): Promise<Trade[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('trades_v2')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.error('Error loading trades:', error); return [] }
  return data || []
}

// ============================================================
// Load a single trade by ID
// ============================================================
export async function loadTrade(tradeId: string): Promise<Trade | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('trades_v2')
    .select('*')
    .eq('id', tradeId)
    .single()

  if (error) { console.error('Error loading trade:', error); return null }
  return data
}

// ============================================================
// Save a new trade
// ============================================================
export async function saveTrade(
  userId: string,
  data: TradeData
): Promise<Trade | null> {
  const supabase = getSupabaseClient()
  const { data: result, error } = await supabase
    .from('trades_v2')
    .insert([{ user_id: userId, data }])
    .select()
    .single()

  if (error) { console.error('Error saving trade:', error); return null }
  return result
}

// ============================================================
// Update an existing trade
// ============================================================
export async function updateTrade(
  tradeId: string,
  data: TradeData
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('trades_v2')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', tradeId)

  if (error) { console.error('Error updating trade:', error); return false }
  return true
}

// ============================================================
// Delete a trade
// ============================================================
export async function deleteTrade(tradeId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('trades_v2')
    .delete()
    .eq('id', tradeId)

  if (error) { console.error('Error deleting trade:', error); return false }
  return true
}