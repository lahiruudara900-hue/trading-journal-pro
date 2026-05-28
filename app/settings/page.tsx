'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [accountName, setAccountName] = useState('My Account')
  const [accountSize, setAccountSize] = useState(0)
  const [riskPerTrade, setRiskPerTrade] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
        setAccountName(data.account_name || 'My Account')
        setAccountSize(data.account_size || 0)
        setRiskPerTrade(data.risk_per_trade || 1)
      }
      setLoading(false)
    }
    init()
  }, [])

  async function handleSaveSettings() {
    setSaving(true)
    const supabase = getSupabaseClient()
    const payload = {
      account_name: accountName,
      account_size: accountSize,
      risk_per_trade: riskPerTrade,
    }
    if (settingsId) {
      await supabase.from('user_settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      const { data } = await supabase.from('user_settings')
        .insert([{ ...payload, user_id: userId }]).select().single()
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

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, paddingTop: '48px', overflowY: 'auto', minHeight: '100vh' }}
          className="md:ml-[190px] md:pt-0">
          <div style={{ padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }}>

            <div className="page-header">
              <div>
                <div className="page-title">Settings</div>
                <div className="page-subtitle">Account and preferences</div>
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
                {/* Profile */}
                <div className="card" style={{ marginBottom: '12px' }}>
                  <div className="section-title">Profile</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label className="form-label">Account Name</label>
                      <input className="form-input" value={accountName}
                        onChange={e => setAccountName(e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Account Size ($)</label>
                        <input type="number" className="form-input"
                          value={accountSize || ''}
                          onChange={e => setAccountSize(parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 10000" />
                      </div>
                      <div>
                        <label className="form-label">Risk Per Trade (%)</label>
                        <input type="number" step="0.1" className="form-input"
                          value={riskPerTrade || ''}
                          onChange={e => setRiskPerTrade(parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 1" />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSaveSettings} disabled={saving} className="btn btn-primary btn-sm">
                      {saving ? 'Saving…' : 'Save Settings'}
                    </button>
                  </div>
                </div>

                {/* Change password */}
                <div className="card" style={{ marginBottom: '12px' }}>
                  <div className="section-title">Change Password</div>
                  <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-input" value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters" required />
                    </div>
                    <div>
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-input" value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password" required />
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