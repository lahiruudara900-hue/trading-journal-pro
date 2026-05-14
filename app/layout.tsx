import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trading Journal Pro',
  description: 'Track, analyze, and improve your trading performance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
        {children}
      </body>
    </html>
  )
}