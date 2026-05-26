'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { getSupabaseClient } from '@/lib/supabase'

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  userId: string
  max?: number
}

export default function MultiScreenshotUpload({ value = [], onChange, userId, max = 5 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (value.length + files.length > max) {
      setError(`Maximum ${max} screenshots allowed.`)
      return
    }
    setError(''); setUploading(true)
    const supabase = getSupabaseClient()
    const uploaded: string[] = []

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { setError('Each file must be under 5 MB.'); continue }
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: err } = await supabase.storage
        .from('trade-screenshots')
        .upload(path, file, { upsert: true })
      if (err) { setError(err.message); continue }
      const { data } = supabase.storage.from('trade-screenshots').getPublicUrl(path)
      uploaded.push(data.publicUrl)
    }

    onChange([...value, ...uploaded])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(url: string) {
    onChange(value.filter(u => u !== url))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Existing images grid */}
      {value.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.5rem',
        }}>
          {value.map((url, i) => (
            <div key={url} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #1f1f2e' }}>
              <Image
                src={url}
                alt={`Screenshot ${i + 1}`}
                width={400}
                height={225}
                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                unoptimized
              />
              {/* Overlay on hover */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.15s',
              }}
                onMouseOver={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                onMouseOut={e => (e.currentTarget as HTMLDivElement).style.opacity = '0'}
              >
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.9)', color: 'white',
                    border: 'none', borderRadius: '0.375rem',
                    padding: '0.375rem 0.75rem', fontSize: '0.75rem',
                    fontWeight: 500, cursor: 'pointer',
                  }}
                >Remove</button>
              </div>
              <div style={{
                position: 'absolute', top: '0.375rem', left: '0.375rem',
                backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '0.25rem',
                padding: '0.125rem 0.375rem', fontSize: '0.65rem', color: 'white',
              }}>
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < max && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', minHeight: '5rem',
            border: '2px dashed #2f2f42', borderRadius: '0.75rem',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            backgroundColor: 'transparent', cursor: 'pointer',
            color: '#8888a0', transition: 'all 0.15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.5)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(59,130,246,0.05)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#c0c0d8'
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2f2f42'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#8888a0'
          }}
        >
          {uploading ? (
            <>
              <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.8125rem' }}>Uploading…</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.5rem' }}>📸</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                {value.length === 0 ? 'Click to upload screenshots' : `Add more (${value.length}/${max})`}
              </span>
              <span style={{ fontSize: '0.75rem' }}>PNG, JPG — Max 5 MB each</span>
            </>
          )}
        </button>
      )}

      {value.length >= max && (
        <div style={{ fontSize: '0.75rem', color: '#555570', textAlign: 'center' }}>
          Maximum {max} screenshots reached
        </div>
      )}

      {error && <p style={{ fontSize: '0.75rem', color: '#f87171' }}>{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFile}
        disabled={uploading}
      />
    </div>
  )
}