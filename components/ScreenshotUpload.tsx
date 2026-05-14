'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { getSupabaseClient } from '@/lib/supabase'

interface Props { value: string | null; onChange: (url: string | null) => void; userId: string }

export default function ScreenshotUpload({ value, onChange, userId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB.'); return }
    setError(''); setUploading(true)
    const supabase = getSupabaseClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: err } = await supabase.storage.from('trade-screenshots').upload(path, file, { upsert: true })
    if (err) { setError(err.message); setUploading(false); return }
    const { data } = supabase.storage.from('trade-screenshots').getPublicUrl(path)
    onChange(data.publicUrl); setUploading(false)
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-[#1f1f2e] group">
          <Image src={value} alt="Trade screenshot" width={800} height={450} className="w-full h-64 object-cover" unoptimized />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs px-3 py-1.5">Replace</button>
            <button type="button" onClick={() => { onChange(null); if (fileRef.current) fileRef.current.value = '' }} className="btn-danger text-xs px-3 py-1.5">Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-[#2f2f42] rounded-xl flex flex-col items-center justify-center gap-2 text-[#8888a0] hover:border-blue-500/50 hover:text-white hover:bg-blue-500/5 transition-all">
          {uploading ? (
            <><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm">Uploading…</span></>
          ) : (
            <><span className="text-3xl">📸</span><span className="text-sm font-medium">Click to upload screenshot</span><span className="text-xs">PNG, JPG — Max 5 MB</span></>
          )}
        </button>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
    </div>
  )
}