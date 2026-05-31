'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: '56px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', background: 'var(--accent)',
            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, color: '#000',
          }}>TJ</div>
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em' }}>
            Trading Journal Pro
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/login" style={{
            fontSize: '13px', color: 'var(--text2)', textDecoration: 'none',
            padding: '6px 14px', borderRadius: '4px', transition: 'color 0.15s',
          }}>Sign In</Link>
          <Link href="/register" style={{
            fontSize: '13px', fontWeight: 500, color: '#000',
            background: '#fff', padding: '6px 14px',
            borderRadius: '4px', textDecoration: 'none', transition: 'background 0.15s',
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 28px', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: '20px', padding: '4px 14px', marginBottom: '28px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 500, letterSpacing: '0.05em' }}>
            ICT-FOCUSED TRADING JOURNAL
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 700, color: 'var(--text)',
          lineHeight: 1.15, letterSpacing: '-0.02em',
          marginBottom: '20px', maxWidth: '680px',
        }}>
          Trade with{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>precision</span>
          ,<br />journal with clarity.
        </h1>

        <p style={{
          fontSize: '15px', color: 'var(--text2)', maxWidth: '480px',
          lineHeight: 1.7, marginBottom: '36px',
        }}>
          Log trades, plan your sessions, track ICT setups, upload chart screenshots,
          and analyze your performance — all in one clean terminal-style dashboard.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' }}>
          <Link href="/register" style={{
            fontSize: '13.5px', fontWeight: 600, color: '#000',
            background: '#fff', padding: '10px 24px',
            borderRadius: '4px', textDecoration: 'none',
          }}>Start for Free →</Link>
          <Link href="/login" style={{
            fontSize: '13.5px', fontWeight: 500, color: 'var(--text2)',
            background: 'transparent', padding: '10px 24px',
            borderRadius: '4px', textDecoration: 'none',
            border: '1px solid var(--border2)',
          }}>Sign In</Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '0', flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: '64px',
          border: '1px solid var(--border)', borderRadius: '6px',
          background: 'var(--bg2)', overflow: 'hidden',
        }}>
          {[
            { value: '20+', label: 'Custom Fields' },
            { value: '∞', label: 'Trades Logged' },
            { value: '7', label: 'Journal Sections' },
            { value: '100%', label: 'Free to Use' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '18px 28px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              minWidth: '120px',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '22px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px', maxWidth: '800px', width: '100%', textAlign: 'left',
        }}>
          {[
            { icon: '📋', title: 'Pre-Market Plan', desc: 'Plan your session bias, key levels, and targets before the market opens.' },
            { icon: '📊', title: 'Trade Journal', desc: 'Log every trade with fully customizable fields — build your own form.' },
            { icon: '🧩', title: 'Field Builder', desc: 'Add, remove, and reorder any field. Text, dropdowns, screenshots, and more.' },
            { icon: '📸', title: 'Screenshot Upload', desc: 'Attach chart images to trades and pre-market plans for visual review.' },
            { icon: '🪞', title: 'Reflections', desc: 'Daily, weekly, and monthly reviews to identify patterns in your trading.' },
            { icon: '📚', title: 'Study Notes', desc: 'Document market analysis, session observations, and key takeaways.' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '16px',
              transition: 'border-color 0.15s',
            }}
              onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,170,0.3)'}
              onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{f.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '5px' }}>{f.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px 28px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px', height: '20px', background: 'var(--accent)',
            borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, color: '#000',
          }}>TJ</div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Trading Journal Pro — Built for serious traders
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  )
}