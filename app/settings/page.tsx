'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'

interface Settings {
  account_name: string
  account_size: number
  risk_per_trade: number
  instruments: string[]
  protocols: string[]
  rules: string[]
}

const DEFAULT_SETTINGS: Settings = {
  account_name: 'My Account',
  account_size: 0,
  risk_per_trade: 1,
  instruments: [],
  protocols: [],
  rules: [],
}

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // List inputs
  const [newInstrument, setNewInstrument] = useState('')
  const [newProtocol, setNewProtocol] = useState('')
  const [newRule, setNewRule] = useState('')

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email || '')

      const { data } = await supabase
        .from('user_settings').select('*').eq('user_id', user.id).single()
      if (data) {
        setSettingsId(data.id)
        setSettings({
          account_name: data.account_name || 'My Account',
          account_size: data.account_size || 0,
          risk_per_trade: data.risk_per_trade || 1,
          instruments: data.instruments || [],
          protocols: data.protocols || [],
          rules: data.rules || [],
        })
      }
      setLoading(false)
    }
    init()
  }, [])

  async function handleSaveSettings() {
    setSaving(true)
    const supabase = getSupabaseClient()
    if (settingsId) {
      await supabase.from('user_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      const { data } = await supabase.from('user_settings')
        .insert([{ ...settings, user_id: userId }]).select().single()
      if (data) setSettingsId(data.id)
    }
    setSaving(false)
    showMsg('success', 'Settings saved!')
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showMsg('error', 'Passwords do not match.'); return }
    if (newPassword.length < 6) { showMsg('error', 'Min 6 characters.'); return }
    setPwSaving(true)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) showMsg('error', error.message)
    else { showMsg('success', 'Password updated!'); setNewPassword(''); setConfirmPassword('') }
    setPwSaving(false)
  }

  async function handleDeleteAccount() {
    if (!confirm('Delete ALL your data and account permanently?')) return
    if (!confirm('Last warning — this cannot be undone.')) return
    const supabase = getSupabaseClient()
    await supabase.from('trades_v2').delete().eq('user_id', userId)
    await supabase.from('fields').delete().eq('user_id', userId)
    await supabase.from('premarket_plans').delete().eq('user_id', userId)
    await supabase.from('premarket_fields').delete().eq('user_id', userId)
    await supabase.from('reflections').delete().eq('user_id', userId)
    await supabase.from('study_entries').delete().eq('user_id', userId)
    await supabase.from('user_settings').delete().eq('user_id', userId)
    await supabase.auth.signOut()
    router.push('/')
  }

  // List helpers
  function addItem(key: 'instruments' | 'protocols' | 'rules', value: string) {
    const v = value.trim()
    if (!v || settings[key].includes(v)) return
    setSettings(s => ({ ...s, [key]: [...s[key], v] }))
  }
  function removeItem(key: 'instruments' | 'protocols' | 'rules', value: string) {
    setSettings(s => ({ ...s, [key]: s[key].filter(i => i !== value) }))
  }

  const ListManager = ({
    title, items, newVal, setNewVal, onAdd, onRemove, placeholder,
  }: {
    title: string; items: string[]; newVal: string
    setNewVal: (v: string) => void; onAdd: () => void
    onRemove: (v: string) => void; placeholder: string
  }) => (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div className="section-title">{title}</div>
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '8px' }}>
        {items.length === 0 ? (
          <div style={{ fontSize: '12.5px', color: 'var(--text3)', padding: '8px 0' }}>None added yet.</div>
        ) : items.map(item => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', background: 'var(--bg3)', borderRadius: 'var(--radius)',
            marginBottom: '4px', border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '13px', fontFamily: title === 'Instruments' ? 'var(--mono)' : 'inherit' }}>{item}</span>
            <button onClick={() => onRemove(item)} style={{
              background: 'none', border: 'none', color: 'var(--text3)',
              cursor: 'pointer', fontSize: '13px', padding: '0 4px',
              lineHeight: 1,
            }}
              onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'}
              onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'}
            >✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          className="form-input" style={{ flex: 1 }}
          value={newVal} onChange={e => setNewVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        />
        <button onClick={onAdd} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
          + Add
        </button>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px', maxWidth: '700px', margin: '0 auto' }}>

            {/* Header */}
            <div className="page-header">
              <div>
                <div className="page-title">Settings</div>
                <div className="page-subtitle">Account, system, and preferences</div>
              </div>
            </div>

            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
                background: message.type === 'success' ? 'rgba(0,201,128,0.1)' : 'rgba(255,77,106,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(0,201,128,0.2)' : 'rgba(255,77,106,0.2)'}`,
                color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
                fontSize: '13px',
              }}>{message.text}</div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* Profile card */}
                <div className="card" style={{ marginBottom: '12px' }}>
                  <div className="section-title">Profile</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: 700, color: 'var(--accent)',
                      fontFamily: 'var(--mono)',
                    }}>
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Trader account</div>
                    </div>
                  </div>
                </div>

                {/* Account settings */}
                <div className="card" style={{ marginBottom: '12px' }}>
                  <div className="section-title">Account Settings</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Account Name</label>
                      <input className="form-input" value={settings.account_name}
                        onChange={e => setSettings(s => ({ ...s, account_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Account Size ($)</label>
                      <input type="number" className="form-input"
                        value={settings.account_size || ''}
                        onChange={e => setSettings(s => ({ ...s, account_size: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 10000" />
                    </div>
                    <div>
                      <label className="form-label">Risk Per Trade (%)</label>
                      <input type="number" step="0.1" className="form-input"
                        value={settings.risk_per_trade || ''}
                        onChange={e => setSettings(s => ({ ...s, risk_per_trade: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 1" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary btn-sm">
                      {saving ? 'Saving…' : 'Save Settings'}
                    </button>
                  </div>
                </div>

                {/* Instruments */}
                <ListManager
                  title="Instruments"
                  items={settings.instruments}
                  newVal={newInstrument}
                  setNewVal={setNewInstrument}
                  onAdd={() => { addItem('instruments', newInstrument); setNewInstrument('') }}
                  onRemove={v => removeItem('instruments', v)}
                  placeholder="e.g. EURUSD, NAS100, XAUUSD…"
                />

                {/* Protocols / Setups */}
                <ListManager
                  title="Protocols / Setups"
                  items={settings.protocols}
                  newVal={newProtocol}
                  setNewVal={setNewProtocol}
                  onAdd={() => { addItem('protocols', newProtocol); setNewProtocol('') }}
                  onRemove={v => removeItem('protocols', v)}
                  placeholder="e.g. Silver Bullet, FVG, OTE…"
                />

                {/* Trading Rules */}
                <ListManager
                  title="Trading Rules Checklist"
                  items={settings.rules}
                  newVal={newRule}
                  setNewVal={setNewRule}
                  onAdd={() => { addItem('rules', newRule); setNewRule('') }}
                  onRemove={v => removeItem('rules', v)}
                  placeholder="e.g. Only trade during Kill Zones…"
                />

                {/* Save system settings */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving…' : 'Save All Settings'}
                  </button>
                </div>

                {/* Change password */}
                <div className="card" style={{ marginBottom: '12px' }}>
                  <div className="section-title">Change Password</div>
                  <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-input" value={newPassword}
                        onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required />
                    </div>
                    <div>
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-input" value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={pwSaving}>
                        {pwSaving ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Danger zone */}
                <div className="card" style={{ borderColor: 'rgba(255,77,106,0.2)' }}>
                  <div className="section-title" style={{ color: 'var(--red)' }}>Danger Zone</div>
                  <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px' }}>
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                  <button onClick={handleDeleteAccount} className="btn btn-danger btn-sm">
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}