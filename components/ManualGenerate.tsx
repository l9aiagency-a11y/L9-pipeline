'use client'
import { useState } from 'react'
import { Post } from '@/lib/types'
import { Plus, Loader2 } from 'lucide-react'

export function ManualGenerate({ onGenerated }: { onGenerated: (posts: Post[]) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      for (const post of posts) {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post),
        })
      }
    } catch {
      setError('Generovani selhalo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generuji...
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            3 varianty
          </>
        )}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
