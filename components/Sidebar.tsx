'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',     icon: '⬛' },
  { href: '/trades/add', label: 'Add Trade',      icon: '➕' },
  { href: '/trades/history', label: 'Trade History', icon: '📋' },
  { href: '/fields',     label: 'Field Builder',  icon: '🧩' },
  { href: '/settings',   label: 'Settings',       icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await getSupabaseClient().auth.signOut()
    router.push('/login')
  }

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '1.25rem 1rem', borderBottom: '1px solid #1f1f2e',
      }}>
        <div style={{
          width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem',
          backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem',
          flexShrink: 0,
        }}>T</div>
        <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>
          Trading Journal Pro
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
                fontSize: '0.875rem', fontWeight: 500,
                textDecoration: 'none',
                backgroundColor: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: active ? '#60a5fa' : '#8888a0',
                border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #1f1f2e' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
            fontSize: '0.875rem', fontWeight: 500,
            backgroundColor: 'transparent', color: '#8888a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#f87171'
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#8888a0'
          }}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside style={{
        display: 'none', flexDirection: 'column',
        width: '14rem', backgroundColor: '#111118',
        borderRight: '1px solid #1f1f2e',
        minHeight: '100vh', position: 'fixed',
        top: 0, left: 0, zIndex: 30,
      }}
        className="md:flex"
      >
        <Content />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: '#111118', borderBottom: '1px solid #1f1f2e',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
      }}
        className="md:hidden"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem',
            backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem',
          }}>T</div>
          <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>Trading Journal Pro</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            padding: '0.5rem', borderRadius: '0.5rem',
            backgroundColor: 'transparent', border: 'none',
            color: '#8888a0', cursor: 'pointer', fontSize: '1.125rem',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setMobileOpen(false)}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <aside
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: '16rem',
              backgroundColor: '#111118', borderRight: '1px solid #1f1f2e', zIndex: 50,
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