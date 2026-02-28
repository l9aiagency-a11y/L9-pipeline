'use client'
import { useEffect, useState } from 'react'
import { ViralIdea } from '@/lib/types'
import { ViralIdeaCard } from '@/components/ViralIdeaCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, Loader2, Lightbulb } from 'lucide-react'

export default function ViralPage() {
  const [ideas, setIdeas] = useState<ViralIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [topicHint, setTopicHint] = useState('')

  useEffect(() => {
    fetch('/api/viral')
      .then(r => r.json())
      .then(setIdeas)
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [])

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/viral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_hint: topicHint || undefined }),
      })
      const idea: ViralIdea = await res.json()
      if (idea.id) setIdeas(prev => [idea, ...prev.filter(i => i.id !== idea.id)])
      else alert('Chyba: ' + JSON.stringify(idea))
    } catch {
      alert('Nepodarilo se vygenerovat napad')
    } finally {
      setLoading(false)
    }
  }

  const updateIdea = (updated: ViralIdea) => {
    setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  const counts = {
    new: ideas.filter(i => i.status === 'new').length,
    scripted: ideas.filter(i => i.status === 'scripted').length,
    recorded: ideas.filter(i => i.status === 'recorded').length,
    posted: ideas.filter(i => i.status === 'posted').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="px-4 pt-6 md:px-6 md:pt-8">
          <h1 className="text-2xl font-semibold text-foreground">Viralni Ideas</h1>
          <p className="text-sm text-muted-foreground mt-1">Claude vygeneruje TikTok/Reel napad s hookem, scenarem a ElevenLabs hlasem.</p>
        </div>

        {/* Status pills */}
        <div className="flex gap-2 px-4 md:px-6 overflow-x-auto scrollbar-hide">
          {[
            { label: `${counts.new} Nove`, dot: 'bg-yellow-400' },
            { label: `${counts.scripted} Scenar`, dot: 'bg-blue-400' },
            { label: `${counts.recorded} Natoceno`, dot: 'bg-purple-400' },
            { label: `${counts.posted} Zverejneno`, dot: 'bg-green-400' },
          ].map(({ label, dot }) => (
            <span key={label} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-card border border-border text-muted-foreground whitespace-nowrap">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>

        {/* Generate card */}
        <div className="bg-card rounded-2xl p-4 mx-4 md:mx-6">
          <div className="text-xs tracking-widest text-muted-foreground uppercase mb-3">Vygenerovat novy napad</div>
          <input
            type="text"
            value={topicHint}
            onChange={e => setTopicHint(e.target.value)}
            placeholder="Volitelne tema (nechej prazdne pro AI vyber)..."
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors mb-3"
            onKeyDown={e => e.key === 'Enter' && generate()}
          />
          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generuji...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Vygenerovat
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Rano v 7:00 se automaticky vygeneruje denni napad.
          </p>
        </div>

        {/* Ideas list */}
        <section className="px-4 pb-6 md:px-6 md:pb-8">
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-3">Napady</h2>

          {initialLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm text-muted-foreground mb-1">Zatim zadne napady</div>
              <div className="text-xs text-muted-foreground/60">Klikni Vygenerovat vyse</div>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map(idea => (
                <ViralIdeaCard key={idea.id} idea={idea} onUpdate={updateIdea} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
