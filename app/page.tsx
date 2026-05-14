'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f2e]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="font-semibold text-white tracking-tight">Trading Journal Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#8888a0] hover:text-white transition-colors px-3 py-1.5">Login</Link>
          <Link href="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium text-blue-400 tracking-wide">ICT-Focused Trading Journal</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight tracking-tight max-w-3xl">
          Trade with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">precision</span>
          ,<br />journal with clarity.
        </h1>
        <p className="text-[#8888a0] text-lg max-w-xl mb-10 leading-relaxed">
          Log trades, track your ICT setups, upload chart screenshots, and analyze your performance — all in one clean dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">Start for Free</Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">Sign In</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full text-left">
          {[
            { icon: '📊', title: 'Performance Dashboard', desc: 'Win rate, P&L, average R:R, and rule-following score at a glance.' },
            { icon: '📸', title: 'Screenshot Uploads', desc: 'Attach chart screenshots to each trade for visual review.' },
            { icon: '🧠', title: 'ICT Setup Tracking', desc: 'Log FVG, OTE, SMT, Silver Bullet, and more per trade.' },
          ].map(f => (
            <div key={f.title} className="card p-5 card-glow">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
              <div className="text-xs text-[#8888a0] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-[#555570] border-t border-[#1f1f2e]">
        © {new Date().getFullYear()} Trading Journal Pro
      </footer>
    </div>
  )
}