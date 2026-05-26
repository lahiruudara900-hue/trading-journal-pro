import { getSupabaseClient } from './supabase'
import { Field, FieldType } from './types'

// ── Premarket Fields ──────────────────────────

export async function loadPremarketFields(userId: string): Promise<Field[]> {
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('premarket_fields')
    .select('*')
    .eq('user_id', userId)
    .order('field_order', { ascending: true })
  return (data || []).map(f => ({
    ...f,
    field_options: Array.isArray(f.field_options)
      ? f.field_options
      : JSON.parse(f.field_options || '[]'),
  }))
}

export async function hasPremarketFields(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { count } = await supabase
    .from('premarket_fields')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count || 0) > 0
}

export async function createDefaultPremarketFields(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.rpc('create_default_premarket_fields', { p_user_id: userId })
}

export async function addPremarketField(
  userId: string,
  field: { field_name: string; field_type: FieldType; field_options: string[] },
  currentCount: number
): Promise<Field | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('premarket_fields')
    .insert([{ user_id: userId, ...field, field_order: currentCount + 1 }])
    .select().single()
  if (error) return null
  return { ...data, field_options: data.field_options || [] }
}

export async function updatePremarketField(
  fieldId: string,
  updates: Partial<{ field_name: string; field_type: FieldType; field_options: string[] }>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('premarket_fields').update(updates).eq('id', fieldId)
  return !error
}

export async function deletePremarketField(fieldId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('premarket_fields').delete().eq('id', fieldId)
  return !error
}

export async function reorderPremarketFields(fields: Field[]): Promise<void> {
  const supabase = getSupabaseClient()
  await Promise.all(fields.map((f, i) =>
    supabase.from('premarket_fields').update({ field_order: i + 1 }).eq('id', f.id)
  ))
}

export async function deleteAllPremarketFields(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.from('premarket_fields').delete().eq('user_id', userId)
}

// ── Premarket Plans ───────────────────────────

export interface PremarketPlan {
  id: string
  user_id: string
  plan_date: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export async function loadPremarketPlans(userId: string): Promise<PremarketPlan[]> {
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('premarket_plans')
    .select('*')
    .eq('user_id', userId)
    .order('plan_date', { ascending: false })
  return data || []
}

export async function loadPremarketPlan(id: string): Promise<PremarketPlan | null> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.from('premarket_plans').select('*').eq('id', id).single()
  return data
}

export async function savePremarketPlan(
  userId: string,
  data: Record<string, any>
): Promise<PremarketPlan | null> {
  const supabase = getSupabaseClient()
  const { data: result, error } = await supabase
    .from('premarket_plans')
    .insert([{ user_id: userId, data, plan_date: data['Plan Date'] || new Date().toISOString().slice(0, 10) }])
    .select().single()
  if (error) { console.error(error); return null }
  return result
}

export async function updatePremarketPlan(
  id: string,
  data: Record<string, any>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('premarket_plans')
    .update({ data, plan_date: data['Plan Date'] || new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function deletePremarketPlan(id: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('premarket_plans').delete().eq('id', id)
  return !error
}