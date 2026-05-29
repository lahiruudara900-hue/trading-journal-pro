'use client'
import { useEffect, useState, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'
import MultiScreenshotUpload from '@/components/MultiScreenshotUpload'

type FilterType = 'All' | 'Daily' | 'Weekly' | 'Monthly' | 'Asia' | 'London' | 'NYAM' | 'NY Lunch' | 'NYPM'

interface StudyEntry {
  id: string
  user_id: string
  title: string
  category: string
  session: string
  entry_date: string
  content: string
  key_takeaway: string
  screenshot_url: string
  tags: string[]
  created_at: string
  updated_at: string
}

const EMPTY = {
  title: '', category: 'Daily', session: '',
  entry_date: new Date().toISOString().slice(0, 10),
  content: '', key_takeaway: '', screenshot_url: '', tags: [] as string[],
}

const CATEGORIES = ['Daily', 'Weekly', 'Monthly']
const SESSIONS = ['', 'Asia', 'London', 'NYAM', 'NY Lunch', 'NYPM']

export default function StudyPage() {
  const [userId, setUserId] = useState('')
  const [entries, setEntries] = useState<StudyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('All')
  const [showPanel, setShowPanel] = useState(false)
  const [editing, setEditing] = useState<StudyEntry | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [tagInput, setTagInput] = useState('')

  const showMsg = (text: string) => { setMessage(text); setTimeout(() => setMessage(''), 3000) }

  const load = useCallback(async (uid: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('study_entries').select('*').eq('user_id', uid)
      .order('entry_date', { ascending: false })
    setEntries(data || [])
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
    setScreenshots([])
    setTagInput('')
    setShowPanel(true)
  }

  function openEdit(e: StudyEntry) {
    setEditing(e)
    setForm({
      title: e.title, category: e.category, session: e.session || '',
      entry_date: e.entry_date, content: e.content,
      key_takeaway: e.key_takeaway, screenshot_url: e.screenshot_url,
      tags: e.tags || [],
    })
    setScreenshots(e.screenshot_url ? [e.screenshot_url] : [])
    setTagInput('')
    setShowPanel(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const supabase = getSupabaseClient()
    const payload = {
      ...form,
      screenshot_url: screenshots[0] || '',
      tags: form.tags,
    }
    if (editing) {
      const { error } = await supabase.from('study_entries')
        .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
      if (!error) {
        setEntries(prev => prev.map(e => e.id === editing.id ? { ...e, ...payload } : e))
        showMsg('Entry updated!')
      }
    } else {
      const { data, error } = await supabase.from('study_entries')
        .insert([{ ...payload, user_id: userId }]).select().single()
      if (!error && data) {
        setEntries(prev => [data, ...prev])
        showMsg('Entry saved!')
      }
    }
    setShowPanel(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    const supabase = getSupabaseClient()
    await supabase.from('study_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t)) return
    setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))
  }

  const filtered = filter === 'All'
    ? entries
    : entries.filter(e =>
        CATEGORIES.includes(filter)
          ? e.category === filter
          : e.session === filter
      )

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      Daily: 'var(--accent2)', Weekly: 'var(--accent)',
      Monthly: 'var(--yellow)',
    }
    return map[cat] || 'var(--text3)'
  }

  const sessionColor = (s: string) => {
    const map: Record<string, string> = {
      Asia: '#a78bfa', London: 'var(--accent)',
      NYAM: 'var(--yellow)', 'NY Lunch': 'var(--text3)', NYPM: '#fb923c',
    }
    return map[s] || 'var(--text3)'
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
                <div className="page-title">Study</div>
                <div className="page-subtitle">Chart analysis, session notes, and market observations</div>
              </div>
              <button onClick={openNew} className="btn btn-primary">+ New Entry</button>
            </div>

            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)',
                color: 'var(--accent)', fontSize: '13px',
              }}>{message}</div>
            )}

            {/* Filters */}
            <div className="filter-bar">
              {(['All', 'Daily', 'Weekly', 'Monthly', 'Asia', 'London', 'NYAM', 'NY Lunch', 'NYPM'] as FilterType[]).map(f => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="es-icon">📚</div>
                <div className="es-text">No study entries yet. Start documenting your market analysis.</div>
                <button onClick={openNew} className="btn btn-primary" style={{ marginTop: '16px' }}>
                  + New Entry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map(entry => {
                  const isExpanded = expandedId === entry.id
                  return (
                    <div key={entry.id} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', overflow: 'hidden',
                    }}>
                      {/* Card header */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '13px 16px', cursor: 'pointer',
                          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          {/* Category badge */}
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                            borderRadius: '3px', fontFamily: 'var(--mono)',
                            background: `${categoryColor(entry.category)}18`,
                            color: categoryColor(entry.category),
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}>{entry.category}</span>
                          {/* Session badge */}
                          {entry.session && (
                            <span style={{
                              fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                              borderRadius: '3px', fontFamily: 'var(--mono)',
                              background: `${sessionColor(entry.session)}18`,
                              color: sessionColor(entry.session),
                              whiteSpace: 'nowrap',
                            }}>{entry.session}</span>
                          )}
                          <span style={{ fontWeight: 600, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.title}
                          </span>
                          {/* Tags */}
                          {entry.tags?.slice(0, 3).map(tag => (
                            <span key={tag} style={{
                              fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
                              background: 'var(--bg4)', color: 'var(--text3)',
                              fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
                            }}>#{tag}</span>
                          ))}
                          {/* Screenshot indicator */}
                          {entry.screenshot_url && (
                            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>📸</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                            {entry.entry_date}
                          </span>
                          <button onClick={e => { e.stopPropagation(); openEdit(entry) }}
                            className="btn btn-ghost btn-sm">Edit</button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(entry.id) }}
                            className="btn btn-danger btn-sm">Delete</button>
                          <span style={{ color: 'var(--text3)', fontSize: '11px' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded body */}
                      {isExpanded && (
                        <div style={{ padding: '16px 20px', background: 'var(--bg3)' }}>
                          {/* Screenshot */}
                          {entry.screenshot_url && (
                            <div style={{ marginBottom: '14px' }}>
                              <img
                                src={entry.screenshot_url}
                                alt="Study screenshot"
                                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer' }}
                                onClick={() => window.open(entry.screenshot_url, '_blank')}
                              />
                            </div>
                          )}

                          {entry.content && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '5px', fontWeight: 600 }}>Analysis</div>
                              <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{entry.content}</div>
                            </div>
                          )}

                          {entry.key_takeaway && (
                            <div style={{
                              padding: '10px 14px', borderRadius: 'var(--radius)',
                              background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.12)',
                            }}>
                              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '4px', fontWeight: 600 }}>
                                💡 Key Takeaway
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{entry.key_takeaway}</div>
                            </div>
                          )}

                          {/* All tags */}
                          {entry.tags?.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                              {entry.tags.map(tag => (
                                <span key={tag} style={{
                                  fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
                                  background: 'var(--bg4)', color: 'var(--text3)',
                                  fontFamily: 'var(--mono)',
                                }}>#{tag}</span>
                              ))}
                            </div>
                          )}
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
            width: 'min(520px, 100vw)', height: '100vh',
            background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{editing ? 'Edit Entry' : 'New Study Entry'}</div>
              <button onClick={() => setShowPanel(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => set('title', e.target.value)} placeholder="e.g. London Open — EURUSD FVG Setup" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Session</label>
                  <select className="form-select" value={form.session} onChange={e => set('session', e.target.value)}>
                    {SESSIONS.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.entry_date}
                    onChange={e => set('entry_date', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label">Analysis / Notes</label>
                <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }}
                  value={form.content} onChange={e => set('content', e.target.value)}
                  placeholder="What did you observe? What was the market narrative?" />
              </div>

              <div>
                <label className="form-label">Key Takeaway</label>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }}
                  value={form.key_takeaway} onChange={e => set('key_takeaway', e.target.value)}
                  placeholder="The single most important thing you learned" />
              </div>

              {/* Tags */}
              <div>
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {form.tags.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', padding: '2px 8px', borderRadius: '3px',
                      background: 'var(--bg4)', color: 'var(--text2)', fontFamily: 'var(--mono)',
                    }}>
                      #{tag}
                      <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '10px', padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="form-input" value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag (press Enter)" />
                  <button onClick={addTag} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <label className="form-label">Chart Screenshot</label>
                {userId && (
                  <MultiScreenshotUpload
                    value={screenshots}
                    onChange={urls => { setScreenshots(urls); set('screenshot_url', urls[0] || '') }}
                    userId={userId}
                    max={3}
                  />
                )}
              </div>
            </div>

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