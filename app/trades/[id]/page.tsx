'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import TradeDetails from '@/components/TradeDetails'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade } from '@/lib/types'

export default function TradeReviewPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getSupabaseClient().from('trades').select('*').eq('id', id).single()
      .then(({ data }) => { setTrade(data); setLoading(false) })
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this trade?')) return
    await getSupabaseClient().from('trades').delete().eq('id', id)
    router.push('/trades/history')
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
            <Link href="/trades/history" className="text-[#8888a0] hover:text-white text-sm">← Back to History</Link>
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : trade ? (
              <TradeDetails trade={trade} onDelete={handleDelete} />
            ) : (
              <div className="card p-10 text-center text-[#8888a0]">Trade not found.</div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}