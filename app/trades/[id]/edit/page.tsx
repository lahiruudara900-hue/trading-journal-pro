'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import TradeForm from '@/components/TradeForm'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade } from '@/lib/types'

export default function EditTradePage() {
  const { id } = useParams<{ id: string }>()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const { data } = await supabase.from('trades').select('*').eq('id', id).single()
      setTrade(data); setLoading(false)
    }
    load()
  }, [id])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
            <Link href={`/trades/${id}`} className="text-[#8888a0] hover:text-white text-sm">← Back</Link>
            <div><h1 className="text-xl font-bold text-white">Edit Trade</h1></div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : trade && userId ? (
              <TradeForm existing={trade} userId={userId} />
            ) : (
              <div className="card p-8 text-center text-[#8888a0]">Trade not found.</div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}