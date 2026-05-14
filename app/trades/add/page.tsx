'use client'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import TradeForm from '@/components/TradeForm'
import { getSupabaseClient } from '@/lib/supabase'

export default function AddTradePage() {
  const [userId, setUserId] = useState('')
  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-56 pt-14 md:pt-0">
          <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
            <div><h1 className="text-xl font-bold text-white">Log New Trade</h1><p className="text-sm text-[#8888a0]">Record your trade details.</p></div>
            {userId ? <TradeForm userId={userId} /> : <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}