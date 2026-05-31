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
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✉️</div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Check your email</h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: 1.6 }}>
          We sent a confirmation link to{' '}
          <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Click it to activate your account, then{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>sign in</Link>.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: '56px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg2)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px', background: 'var(--accent)',
            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, color: '#000',
          }}>TJ</div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Trading Journal Pro</span>
        </Link>
        <Link href="/login" style={{
          fontSize: '12.5px', color: 'var(--text2)', textDecoration: 'none',
          padding: '6px 14px', border: '1px solid var(--border2)', borderRadius: '4px',
        }}>Sign In</Link>
      </nav>

      {/* Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '40px', height: '40px', background: 'var(--accent)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: '#000',
              margin: '0 auto 16px',
            }}>TJ</div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px' }}>Create your account</h1>
            <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Start journaling your trades today</p>
          </div>

          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '24px',
          }}>
            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: '4px', marginBottom: '16px',
                background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)',
                color: 'var(--red)', fontSize: '12.5px',
              }}>{error}</div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '10px',
                  background: '#fff', color: '#000',
                  border: 'none', borderRadius: '4px',
                  fontSize: '13.5px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, marginTop: '4px',
                }}
              >
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)', marginTop: '16px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}