'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { getSupabaseClient } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success'|'error'; text: string }|null>(null)
  const [userId, setUserId] = useState('')
  const [tradeCount, setTradeCount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || ''); setUserId(user.id)
        const { count } = await supabase.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        setTradeCount(count || 0)
      }
    }
    load()
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Passwords do not match.' }); return }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Minimum 6 characters.' }); return }
    setLoading(true)
    const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword })
    if (error) setMessage({ type: 'error', text: error.message })
    else { setMessage({ type: 'success', text: 'Password updated!' }); setNewPassword(''); setConfirmPassword('') }
    setLoading(false)
  }

  async function handleDeleteAccount() {
    if (!confirm('Delete ALL your trades and account permanently?')) return
    if (!confirm('This cannot be undone. Are you sure?')) return
    const supabase = getSupabaseClient()
    await supabase.from('trades').delete().eq('user_id', userId)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto space-y-6">
            <div><h1 className="text-xl font-bold text-white">Settings</h1><p className="text-sm text-[#8888a0]">Manage your account.</p></div>
            <div className="card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest">Profile</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">{email.charAt(0).toUpperCase()}</div>
                <div><div className="text-sm font-medium text-white">{email}</div><div className="text-xs text-[#8888a0]">{tradeCount} trade{tradeCount !== 1 ? 's' : ''} logged</div></div>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-4">Change Password</h3>
              {message && <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{message.text}</div>}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div><label className="form-label">New Password</label><input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
                <div><label className="form-label">Confirm Password</label><input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Updating…' : 'Update Password'}</button>
              </form>
            </div>
            <div className="card p-5 border-red-500/20">
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">Danger Zone</h3>
              <p className="text-sm text-[#8888a0] mb-4">Permanently delete your account and all trade data.</p>
              <button onClick={handleDeleteAccount} className="btn-danger">Delete Account</button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}