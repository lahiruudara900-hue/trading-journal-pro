'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { href: '/trades/add', label: 'Add Trade', icon: '➕' },
  { href: '/trades/history', label: 'Trade History', icon: '📋' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#1f1f2e]">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">T</div>
        <span className="font-semibold text-white text-sm">Trading Journal Pro</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-[#8888a0] hover:text-white hover:bg-[#1e1e2a]'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-[#1f1f2e]">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-red-400 hover:bg-red-500/10 transition-all">
          <span>🚪</span>Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 bg-[#111118] border-r border-[#1f1f2e] min-h-screen fixed top-0 left-0 z-30">
        <Content />
      </aside>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111118] border-b border-[#1f1f2e] fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center text-white font-bold text-xs">T</div>
          <span className="font-semibold text-white text-sm">Trading Journal Pro</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-[#8888a0] hover:text-white">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-[#111118] border-r border-[#1f1f2e] z-50" onClick={e => e.stopPropagation()}>
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}