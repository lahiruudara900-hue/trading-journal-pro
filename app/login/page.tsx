'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">T</div>
            <span className="font-semibold text-white">Trading Journal Pro</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-[#8888a0] text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="card p-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-5">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="form-label">Email</label><input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="form-label">Password</label><input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
        </div>
        <p className="text-center text-sm text-[#8888a0] mt-4">No account? <Link href="/register" className="text-blue-400 hover:text-blue-300">Create one</Link></p>
      </div>
    </div>
  )
}