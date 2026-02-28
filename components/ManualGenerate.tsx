'use client'
import { useState } from 'react'
import { Post } from '@/lib/types'
import { getTodaySchedule } from '@/lib/schedule'
import { POST_TYPE_LABELS, POST_TYPE_EMOJI } from '@/lib/types'

export function ManualGenerate({ onGenerated }: { onGenerated: (posts: Post[]) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = getTodaySchedule()

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const posts = await res.json() as Post[]
      onGenerated(posts)
      // Send each variant to WhatsApp (same as cron does)
      for (const post of posts) {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post),
        })
      }
    } catch {
      setError('Generování selhalo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
        <span>{POST_TYPE_EMOJI[today.type]}</span>
        <span>{POST_TYPE_LABELS[today.type]}</span>
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-[#0077FF] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0077FF]/20 transition-all hover:bg-[#0066EE] hover:shadow-[#0077FF]/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generuji…
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            3 varianty
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
