'use client'
import { useEffect, useState, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import DynamicField from '@/components/DynamicField'
import FieldBuilderModal from '@/components/FieldBuilderModal'
import FieldBuilderList from '@/components/FieldBuilderList'
import { getSupabaseClient } from '@/lib/supabase'
import { Field, FieldType } from '@/lib/types'
import {
  loadPremarketFields, hasPremarketFields, createDefaultPremarketFields,
  addPremarketField, updatePremarketField, deletePremarketField,
  reorderPremarketFields, deleteAllPremarketFields,
  loadPremarketPlans, savePremarketPlan, updatePremarketPlan,
  deletePremarketPlan, PremarketPlan,
} from '@/lib/premarket'

type Tab = 'plans' | 'fields'

export default function PremarketPage() {
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<Tab>('plans')

  // Plans state
  const [plans, setPlans] = useState<PremarketPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PremarketPlan | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [planData, setPlanData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  // Fields state
  const [fields, setFields] = useState<Field[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(true)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [fieldSaving, setFieldSaving] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadFields = useCallback(async (uid: string) => {
    const data = await loadPremarketFields(uid)
    setFields(data)
    setFieldsLoading(false)
  }, [])

  const loadPlans = useCallback(async (uid: string) => {
    const data = await loadPremarketPlans(uid)
    setPlans(data)
    setPlansLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await Promise.all([loadFields(user.id), loadPlans(user.id)])
    }
    init()
  }, [loadFields, loadPlans])

  // ── Plan Actions ──────────────────────────────

  function openNewPlan() {
    setEditingPlan(null)
    setPlanData({ 'Plan Date': new Date().toISOString().slice(0, 10) })
    setShowPlanForm(true)
  }

  function openEditPlan(plan: PremarketPlan) {
    setEditingPlan(plan)
    setPlanData(plan.data || {})
    setShowPlanForm(true)
  }

  async function handleSavePlan() {
    setSaving(true)
    if (editingPlan) {
      const ok = await updatePremarketPlan(editingPlan.id, planData)
      if (ok) {
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, data: planData } : p))
        showMsg('success', 'Plan updated!')
      } else showMsg('error', 'Failed to update plan.')
    } else {
      const result = await savePremarketPlan(userId, planData)
      if (result) {
        setPlans(prev => [result, ...prev])
        showMsg('success', 'Plan saved!')
      } else showMsg('error', 'Failed to save plan.')
    }
    setShowPlanForm(false)
    setEditingPlan(null)
    setSaving(false)
  }

  async function handleDeletePlan(id: string) {
    if (!confirm('Delete this plan?')) return
    const ok = await deletePremarketPlan(id)
    if (ok) setPlans(prev => prev.filter(p => p.id !== id))
  }

  // ── Field Actions ─────────────────────────────

  async function handleLoadDefaults() {
    if (!confirm('Load default pre-market fields?')) return
    setFieldSaving(true)
    await createDefaultPremarketFields(userId)
    await loadFields(userId)
    setFieldSaving(false)
    showMsg('success', 'Default fields loaded!')
  }

  async function handleDeleteAllFields() {
    if (!confirm(`Delete ALL ${fields.length} fields?`)) return
    setFieldSaving(true)
    await deleteAllPremarketFields(userId)
    setFields([])
    setFieldSaving(false)
    showMsg('success', 'All fields deleted.')
  }

  async function handleSaveField(data: { field_name: string; field_type: FieldType; field_options: string[] }) {
    setFieldSaving(true)
    if (editingField) {
      const ok = await updatePremarketField(editingField.id, data)
      if (ok) setFields(prev => prev.map(f => f.id === editingField.id ? { ...f, ...data } : f))
    } else {
      const newField = await addPremarketField(userId, data, fields.length)
      if (newField) setFields(prev => [...prev, newField])
    }
    setShowFieldModal(false)
    setEditingField(null)
    setFieldSaving(false)
    showMsg('success', editingField ? 'Field updated!' : 'Field added!')
  }

  async function handleDeleteField(field: Field) {
    const ok = await deletePremarketField(field.id)
    if (ok) setFields(prev => prev.filter(f => f.id !== field.id))
    showMsg('success', `"${field.field_name}" deleted.`)
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...fields]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setFields(updated)
    await reorderPremarketFields(updated)
  }

  async function handleMoveDown(index: number) {
    if (index === fields.length - 1) return
    const updated = [...fields]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setFields(updated)
    await reorderPremarketFields(updated)
  }

  // ── Get display value for plan card ──────────

  function getPlanTitle(plan: PremarketPlan) {
    return plan.data['Plan Date'] || plan.plan_date || new Date(plan.created_at).toLocaleDateString()
  }

  function getPlanBias(plan: PremarketPlan) {
    return plan.data['Market Bias'] || plan.data['Bias'] || null
  }

  function getPlanPairs(plan: PremarketPlan) {
    const p = plan.data['Pairs to Watch'] || plan.data['Pairs']
    if (Array.isArray(p)) return p.join(', ')
    return p || null
  }

  const biasColor = (bias: string) => {
    if (bias?.toLowerCase().includes('bull')) return 'var(--green)'
    if (bias?.toLowerCase().includes('bear')) return 'var(--red)'
    return 'var(--yellow)'
  }

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{
          flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh',
        }} className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px', maxWidth: '900px', margin: '0 auto' }}>

            {/* Page header */}
            <div className="page-header">
              <div>
                <div className="page-title">Pre-Market Plan</div>
                <div className="page-subtitle">Plan your trading day before the market opens</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTab(tab === 'plans' ? 'fields' : 'plans')}
                  className="btn btn-secondary"
                >
                  {tab === 'plans' ? '🧩 Manage Fields' : '📋 View Plans'}
                </button>
                {tab === 'plans' && (
                  <button onClick={openNewPlan} className="btn btn-primary">
                    + New Plan
                  </button>
                )}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)',
                marginBottom: '16px', fontSize: '13px',
                background: message.type === 'success' ? 'rgba(0,201,128,0.1)' : 'rgba(255,77,106,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(0,201,128,0.2)' : 'rgba(255,77,106,0.2)'}`,
                color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
              }}>{message.text}</div>
            )}

            {/* ── PLANS TAB ─────────────────────── */}
            {tab === 'plans' && (
              <>
                {plansLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="empty-state">
                    <div className="es-icon">📋</div>
                    <div className="es-text">No plans yet. Create your first pre-market plan.</div>
                    <button onClick={openNewPlan} className="btn btn-primary" style={{ marginTop: '16px' }}>+ New Plan</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plans.map(plan => {
                      const isExpanded = expandedPlan === plan.id
                      const bias = getPlanBias(plan)
                      const pairs = getPlanPairs(plan)

                      return (
                        <div key={plan.id} style={{
                          background: 'var(--bg2)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)', overflow: 'hidden',
                        }}>
                          {/* Plan card header */}
                          <div
                            onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '13px 16px', cursor: 'pointer',
                              borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                                {getPlanTitle(plan)}
                              </div>
                              {bias && (
                                <span style={{
                                  fontSize: '10.5px', fontWeight: 600,
                                  fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                                  padding: '2px 8px', borderRadius: '3px',
                                  background: `${biasColor(bias)}18`,
                                  color: biasColor(bias),
                                }}>{bias}</span>
                              )}
                              {pairs && (
                                <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                                  {pairs}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={e => { e.stopPropagation(); openEditPlan(plan) }}
                                className="btn btn-ghost btn-sm"
                              >Edit</button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDeletePlan(plan.id) }}
                                className="btn btn-danger btn-sm"
                              >Delete</button>
                              <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '4px' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>

                          {/* Expanded plan details */}
                          {isExpanded && (
                            <div style={{ padding: '16px', background: 'var(--bg3)' }}>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '16px',
                              }}>
                                {fields.filter(f => f.field_type !== 'screenshot').map(field => {
                                  const val = plan.data[field.field_name]
                                  if (!val && val !== false && val !== 0) return null
                                  return (
                                    <div key={field.id}
                                      style={{ gridColumn: field.field_type === 'textarea' ? '1 / -1' : undefined }}>
                                      <div style={{
                                        fontSize: '10px', textTransform: 'uppercase',
                                        letterSpacing: '0.08em', color: 'var(--text3)',
                                        marginBottom: '4px', fontWeight: 500,
                                      }}>{field.field_name}</div>
                                      <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: field.field_type === 'number' ? 'var(--mono)' : 'inherit' }}>
                                        {field.field_type === 'checkbox' ? (val ? '✅ Yes' : '❌ No') :
                                          Array.isArray(val) ? val.join(', ') : String(val)}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Screenshots */}
                              {fields.filter(f => f.field_type === 'screenshot').map(field => {
                                const urls = Array.isArray(plan.data[field.field_name])
                                  ? plan.data[field.field_name]
                                  : plan.data[field.field_name] ? [plan.data[field.field_name]] : []
                                if (!urls.length) return null
                                return (
                                  <div key={field.id} style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '8px', fontWeight: 500 }}>
                                      {field.field_name}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      {urls.map((url: string, i: number) => (
                                        <img key={i} src={url} alt={`${field.field_name} ${i + 1}`}
                                          style={{ width: '120px', height: '75px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer' }}
                                          onClick={() => window.open(url, '_blank')}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── FIELDS TAB ─────────────────────── */}
            {tab === 'fields' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {fields.length > 0 && (
                    <button onClick={handleDeleteAllFields} disabled={fieldSaving} className="btn btn-danger">
                      🗑️ Delete All
                    </button>
                  )}
                  <button onClick={handleLoadDefaults} disabled={fieldSaving} className="btn btn-secondary">
                    📋 Load Defaults
                  </button>
                  <button onClick={() => { setEditingField(null); setShowFieldModal(true) }} className="btn btn-primary">
                    + Add Field
                  </button>
                </div>

                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                  background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.12)',
                  fontSize: '12.5px', color: 'var(--text3)', lineHeight: 1.6,
                }}>
                  💡 These fields appear in your Pre-Market Plan form. Add anything you review before trading — bias, levels, screenshots, mindset notes.
                </div>

                {fieldsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <FieldBuilderList
                    fields={fields}
                    onEdit={f => { setEditingField(f); setShowFieldModal(true) }}
                    onDelete={handleDeleteField}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Plan Form Modal ─────────────────────── */}
      {showPlanForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        }}>
          <div onClick={() => setShowPlanForm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{
            position: 'relative', zIndex: 10,
            wwidth: 'min(520px, 100vw)', height: '100vh',
            background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.3s ease',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 22px', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>
                {editingPlan ? 'Edit Plan' : 'New Pre-Market Plan'}
              </div>
              <button onClick={() => setShowPlanForm(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
              {fields.length === 0 ? (
                <div className="empty-state">
                  <div className="es-icon">🧩</div>
                  <div className="es-text">No fields configured. Set up your fields first.</div>
                  <button onClick={() => { setShowPlanForm(false); setTab('fields') }} className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Set Up Fields
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {fields.map(field => (
                    <div key={field.id}>
                      <label className="form-label">{field.field_name}</label>
                      <DynamicField
                        field={field}
                        value={planData[field.field_name]}
                        onChange={val => setPlanData(prev => ({ ...prev, [field.field_name]: val }))}
                        userId={userId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div style={{
              padding: '16px 22px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
            }}>
              <button onClick={() => setShowPlanForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSavePlan} disabled={saving || fields.length === 0} className="btn btn-primary">
                {saving ? 'Saving…' : editingPlan ? 'Update Plan' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field builder modal */}
      {showFieldModal && (
        <FieldBuilderModal
          field={editingField}
          onSave={handleSaveField}
          onClose={() => { setShowFieldModal(false); setEditingField(null) }}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </ProtectedRoute>
  )
}