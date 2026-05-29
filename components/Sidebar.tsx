'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',       icon: '⬛' },
  { href: '/premarket',       label: 'Pre-Market Plan',  icon: '📋' },
  { href: '/trades/add',      label: 'Log Trade',        icon: '➕' },
  { href: '/trades/history',  label: 'Trade History',    icon: '📊' },
  { href: '/reflections',     label: 'Reflections',      icon: '🪞' },
  { href: '/study',           label: 'Study',            icon: '📚' },
  { href: '/fields',          label: 'Field Builder',    icon: '🧩' },
  { href: '/settings',        label: 'Settings',         icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await getSupabaseClient().auth.signOut()
    router.push('/login')
  }

  const w = collapsed ? '56px' : '190px'

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 14px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '10px',
        minHeight: '56px',
      }}>
        <div style={{
          width: '28px', height: '28px', minWidth: '28px',
          background: 'var(--accent)', borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, color: '#000',
          flexShrink: 0,
        }}>TJ</div>
        {!collapsed && (
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            Trading Journal
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'var(--text3)', cursor: 'pointer', padding: '2px',
            minWidth: '20px', display: 'flex', alignItems: 'center',
            fontSize: '16px',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >☰</button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navItems.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: '10px', padding: '11px 14px',
                minHeight: '44px',
                cursor: 'pointer', textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text2)',
                fontSize: '13px', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                background: active ? 'rgba(0,212,170,0.07)' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              }}
              onMouseOver={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg3)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'
                }
              }}
              onMouseOut={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text2)'
                }
              }}
            >
              <span style={{ fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: '12.5px', letterSpacing: '0.01em' }}>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '7px 0',
            background: 'none', border: 'none',
            color: 'var(--text3)', cursor: 'pointer',
            fontSize: '12.5px', transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'}
          onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'}
        >
          <span style={{ fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>🚪</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: w, minWidth: w,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'none', flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden', zIndex: 100,
        position: 'fixed', top: 0, left: 0, bottom: 0,
      }}
        className="md:flex"
      >
        <Content />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: '48px',
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      }}
        className="md:hidden"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px',
            background: 'var(--accent)', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#000', fontFamily: 'var(--mono)',
          }}>TJ</div>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Trading Journal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '18px' }}
        >{mobileOpen ? '✕' : '☰'}</button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setMobileOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <aside
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: '190px',
              background: 'var(--bg2)', borderRight: '1px solid var(--border)', zIndex: 201,
            }}
            onClick={e => e.stopPropagation()}
          >
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}