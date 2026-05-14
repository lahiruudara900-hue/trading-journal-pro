'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const { error } = await getSupabaseClient().auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess(true); setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-[#8888a0] text-sm">We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it then <Link href="/login" className="text-blue-400">sign in</Link>.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">T</div>
            <span className="font-semibold text-white">Trading Journal Pro</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
        </div>
        <div className="card p-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-5">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <div><label className="form-label">Email</label><input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="form-label">Password</label><input type="password" className="form-input" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <div><label className="form-label">Confirm Password</label><input type="password" className="form-input" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
          </form>
        </div>
        <p className="text-center text-sm text-[#8888a0] mt-4">Already have an account? <Link href="/login" className="text-blue-400">Sign in</Link></p>
      </div>
    </div>
  )
}