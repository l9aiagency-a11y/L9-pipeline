'use client'
import { useEffect, useState } from 'react'
import { ViralIdea } from '@/lib/types'
import { ViralIdeaCard } from '@/components/ViralIdeaCard'

export default function ViralPage() {
  const [ideas, setIdeas] = useState<ViralIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [topicHint, setTopicHint] = useState('')

  useEffect(() => {
    fetch('/api/viral').then(r => r.json()).then(setIdeas).catch(() => {})
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
      alert('Nepodařilo se vygenerovat nápad')
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
    <div className="min-h-screen bg-[#050505]">
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white mb-1">🔥 Virální Ideas</h1>
          <p className="text-sm text-gray-500">Claude vygeneruje TikTok/Reel nápad s hookem, scénářem a ElevenLabs hlasem.</p>
        </div>

        {/* Status bar */}
        <div className="flex gap-6 text-sm">
          <span><span className="text-amber-400">●</span> <span className="text-gray-400">{counts.new} Nové</span></span>
          <span><span className="text-blue-400">●</span> <span className="text-gray-400">{counts.scripted} Scénář</span></span>
          <span><span className="text-purple-400">●</span> <span className="text-gray-400">{counts.recorded} Natočeno</span></span>
          <span><span className="text-emerald-400">●</span> <span className="text-gray-400">{counts.posted} Zveřejněno</span></span>
        </div>

        {/* Generate */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0E0E0E] p-4 space-y-3">
          <div className="text-xs text-gray-500 uppercase tracking-widest">Vygenerovat nový nápad</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={topicHint}
              onChange={e => setTopicHint(e.target.value)}
              placeholder="Volitelné téma (nechej prázdné pro AI výběr)…"
              className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 border border-[#2a2a2a] placeholder-gray-600 focus:outline-none focus:border-[#0077FF]"
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
            <button
              onClick={generate}
              disabled={loading}
              className="bg-[#0077FF] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#0066DD] disabled:opacity-50 transition-colors shrink-0"
            >
              {loading ? '⏳ Generuju...' : '⚡ Vygenerovat'}
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Ráno v 7:00 se automaticky vygeneruje denní nápad a odešle do Telegramu.
          </p>
        </div>

        {/* Ideas list */}
        {ideas.length === 0 && !loading && (
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0E0E0E] p-10 text-center text-gray-500">
            Zatím žádné nápady. Klikni <span className="text-[#4DA6FF]">Vygenerovat</span> výše.
          </div>
        )}

        <div className="space-y-4">
          {ideas.map(idea => (
            <ViralIdeaCard key={idea.id} idea={idea} onUpdate={updateIdea} />
          ))}
        </div>
      </main>
    </div>
  )
}
