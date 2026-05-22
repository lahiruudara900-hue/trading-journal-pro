import { getSupabaseClient } from './supabase'
import { Field, FieldInsert } from './types'

// ============================================================
// Load all fields for the current user (sorted by order)
// ============================================================
export async function loadFields(userId: string): Promise<Field[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('user_id', userId)
    .order('field_order', { ascending: true })

  if (error) {
    console.error('Error loading fields:', error)
    return []
  }

  // Parse field_options from JSON string to array if needed
  return (data || []).map(f => ({
    ...f,
    field_options: Array.isArray(f.field_options)
      ? f.field_options
      : (typeof f.field_options === 'string'
          ? JSON.parse(f.field_options)
          : f.field_options) || [],
  }))
}

// ============================================================
// Create default starter fields for a new user
// ============================================================
export async function createDefaultFields(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.rpc('create_default_fields', { p_user_id: userId })
}

// ============================================================
// Check if user has any fields yet
// ============================================================
export async function hasFields(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { count } = await supabase
    .from('fields')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count || 0) > 0
}

// ============================================================
// Add a new field
// ============================================================
export async function addField(
  userId: string,
  field: Omit<FieldInsert, 'field_order'>,
  currentCount: number
): Promise<Field | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('fields')
    .insert([{
      user_id: userId,
      field_name: field.field_name,
      field_type: field.field_type,
      field_options: field.field_options || [],
      field_order: currentCount + 1,
    }])
    .select()
    .single()

  if (error) { console.error('Error adding field:', error); return null }
  return data
}

// ============================================================
// Update a field
// ============================================================
export async function updateField(
  fieldId: string,
  updates: Partial<FieldInsert>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('fields')
    .update(updates)
    .eq('id', fieldId)

  if (error) { console.error('Error updating field:', error); return false }
  return true
}

// ============================================================
// Delete a field
// ============================================================
export async function deleteField(fieldId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('fields')
    .delete()
    .eq('id', fieldId)

  if (error) { console.error('Error deleting field:', error); return false }
  return true
}

// ============================================================
// Reorder fields — save new order to database
// ============================================================
export async function reorderFields(fields: Field[]): Promise<void> {
  const supabase = getSupabaseClient()
  const updates = fields.map((f, index) =>
    supabase
      .from('fields')
      .update({ field_order: index + 1 })
      .eq('id', f.id)
  )
  await Promise.all(updates)
}