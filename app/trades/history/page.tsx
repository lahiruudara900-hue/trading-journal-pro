'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import TradeTable from '@/components/TradeTable'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade } from '@/lib/types'

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrades = useCallback(async () => {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('trade_date', { ascending: false })
    setTrades(data || []); setLoading(false)
  }, [])

  useEffect(() => { loadTrades() }, [loadTrades])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div><h1 className="text-xl font-bold text-white">Trade History</h1><p className="text-sm text-[#8888a0]">All your logged trades.</p></div>
              <Link href="/trades/add" className="btn-primary text-sm">+ Add Trade</Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : trades.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-lg font-semibold text-white mb-2">No trades yet</h2>
                <Link href="/trades/add" className="btn-primary">Log Your First Trade</Link>
              </div>
            ) : <TradeTable trades={trades} onRefresh={loadTrades} />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}