'use client'
import { useEffect, useState, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'
import StarRating from '@/components/StarRating'

type Period = 'All' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'

interface Reflection {
  id: string
  user_id: string
  title: string
  period: string
  entry_date: string
  content: string
  what_worked: string
  what_failed: string
  lessons: string
  goals_next: string
  rating: number
  created_at: string
  updated_at: string
}

const EMPTY: Omit<Reflection, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  title: '', period: 'Daily', entry_date: new Date().toISOString().slice(0, 10),
  content: '', what_worked: '', what_failed: '',
  lessons: '', goals_next: '', rating: 0,
}

export default function ReflectionsPage() {
  const [userId, setUserId] = useState('')
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Period>('All')
  const [showPanel, setShowPanel] = useState(false)
  const [editing, setEditing] = useState<Reflection | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const showMsg = (text: string) => { setMessage(text); setTimeout(() => setMessage(''), 3000) }

  const load = useCallback(async (uid: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('reflections').select('*').eq('user_id', uid)
      .order('entry_date', { ascending: false })
    setReflections(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      await load(user.id)
    }
    init()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY, entry_date: new Date().toISOString().slice(0, 10) })
    setShowPanel(true)
  }

  function openEdit(r: Reflection) {
    setEditing(r)
    setForm({
      title: r.title, period: r.period, entry_date: r.entry_date,
      content: r.content, what_worked: r.what_worked,
      what_failed: r.what_failed, lessons: r.lessons,
      goals_next: r.goals_next, rating: r.rating,
    })
    setShowPanel(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const supabase = getSupabaseClient()
    if (editing) {
      const { error } = await supabase.from('reflections')
        .update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      if (!error) {
        setReflections(prev => prev.map(r => r.id === editing.id ? { ...r, ...form } : r))
        showMsg('Reflection updated!')
      }
    } else {
      const { data, error } = await supabase.from('reflections')
        .insert([{ ...form, user_id: userId }]).select().single()
      if (!error && data) {
        setReflections(prev => [data, ...prev])
        showMsg('Reflection saved!')
      }
    }
    setShowPanel(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reflection?')) return
    const supabase = getSupabaseClient()
    await supabase.from('reflections').delete().eq('id', id)
    setReflections(prev => prev.filter(r => r.id !== id))
    showMsg('Reflection deleted.')
  }

  const filtered = filter === 'All'
    ? reflections
    : reflections.filter(r => r.period === filter)

  const periodColor = (p: string) => {
    const map: Record<string, string> = {
      Daily: 'var(--accent2)', Weekly: 'var(--accent)',
      Monthly: 'var(--yellow)', Quarterly: 'rgba(255,77,106,0.8)',
    }
    return map[p] || 'var(--text3)'
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px', maxWidth: '860px', margin: '0 auto' }}>

            {/* Header */}
            <div className="page-header">
              <div>
                <div className="page-title">Reflections</div>
                <div className="page-subtitle">Review and learn from your trading journey</div>
              </div>
              <button onClick={openNew} className="btn btn-primary">+ New Reflection</button>
            </div>

            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)',
                color: 'var(--accent)', fontSize: '13px',
              }}>{message}</div>
            )}

            {/* Period filter */}
            <div className="filter-bar">
              {(['All', 'Daily', 'Weekly', 'Monthly', 'Quarterly'] as Period[]).map(p => (
                <button key={p} className={`filter-btn ${filter === p ? 'active' : ''}`}
                  onClick={() => setFilter(p)}>{p}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="es-icon">🪞</div>
                <div className="es-text">No reflections yet. Start reviewing your trading.</div>
                <button onClick={openNew} className="btn btn-primary" style={{ marginTop: '16px' }}>
                  + New Reflection
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map(r => {
                  const isExpanded = expandedId === r.id
                  return (
                    <div key={r.id} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', overflow: 'hidden',
                    }}>
                      {/* Header */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 16px', cursor: 'pointer',
                          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                            borderRadius: '3px', fontFamily: 'var(--mono)',
                            background: `${periodColor(r.period)}18`,
                            color: periodColor(r.period),
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}>{r.period}</span>
                          <span style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.title}
                          </span>
                          {r.rating > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--yellow)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                              {'★'.repeat(Math.min(r.rating, 10))} {r.rating}/10
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                            {r.entry_date}
                          </span>
                          <button onClick={e => { e.stopPropagation(); openEdit(r) }}
                            className="btn btn-ghost btn-sm">Edit</button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                            className="btn btn-danger btn-sm">Delete</button>
                          <span style={{ color: 'var(--text3)', fontSize: '11px' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      {isExpanded && (
                        <div style={{ padding: '16px 20px', background: 'var(--bg3)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {[
                              { label: 'Overview', value: r.content },
                              { label: 'What Worked', value: r.what_worked },
                              { label: 'What Failed', value: r.what_failed },
                              { label: 'Lessons Learned', value: r.lessons },
                              { label: 'Goals for Next Period', value: r.goals_next },
                            ].filter(f => f.value).map(f => (
                              <div key={f.label} style={{ gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '6px', fontWeight: 600 }}>
                                  {f.label}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                  {f.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Side panel */}
      {showPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowPanel(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{
            position: 'relative', zIndex: 10,
            width: 'min(540px, 95vw)', height: '100vh',
            background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.3s ease',
          }}>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>
                {editing ? 'Edit Reflection' : 'New Reflection'}
              </div>
              <button onClick={() => setShowPanel(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title}
                    onChange={e => set('title', e.target.value)} placeholder="e.g. Week 21 Review" />
                </div>
                <div>
                  <label className="form-label">Period</label>
                  <select className="form-select" value={form.period} onChange={e => set('period', e.target.value)}>
                    {['Daily', 'Weekly', 'Monthly', 'Quarterly'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.entry_date}
                    onChange={e => set('entry_date', e.target.value)} />
                </div>
              </div>

              {[
                { key: 'content', label: 'Overview / Summary' },
                { key: 'what_worked', label: 'What Worked' },
                { key: 'what_failed', label: 'What Failed / Mistakes' },
                { key: 'lessons', label: 'Lessons Learned' },
                { key: 'goals_next', label: 'Goals for Next Period' },
              ].map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }}
                    value={(form as any)[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={`Enter ${f.label.toLowerCase()}…`}
                  />
                </div>
              ))}

              <div>
                <label className="form-label">Session Rating</label>
                <StarRating value={form.rating} onChange={v => set('rating', v)} max={10} />
              </div>
            </div>

            {/* Panel footer */}
            <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPanel(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn btn-primary">
                {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </ProtectedRoute>
  )
}