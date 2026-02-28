'use client'
import { useState } from 'react'
import { ViralIdea, ViralStatus, VIRAL_STATUS_LABELS } from '@/lib/types'

const STATUS_COLORS: Record<ViralStatus, string> = {
  new: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  scripted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  recorded: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  posted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
}

interface Props {
  idea: ViralIdea
  onUpdate: (idea: ViralIdea) => void
}

export function ViralIdeaCard({ idea, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [loadingVoice, setLoadingVoice] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | undefined>(idea.audio_url)
  const [copied, setCopied] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const generateVoice = async () => {
    setLoadingVoice(true)
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: idea.script, idea_id: idea.id }),
      })
      const data = await res.json()
      if (data.audio) {
        setAudioSrc(data.audio)
        onUpdate({ ...idea, audio_url: data.audio })
      } else {
        alert('Chyba: ' + (data.error || 'Neznámá chyba'))
      }
    } catch {
      alert('Nepodařilo se vygenerovat hlas')
    } finally {
      setLoadingVoice(false)
    }
  }

  const copyScript = async () => {
    await navigator.clipboard.writeText(
      `${idea.hook}\n\n${idea.script}\n\n${idea.hashtags.map(h => '#' + h.replace('#', '')).join(' ')}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateStatus = async (status: ViralStatus) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/viral/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const updated = await res.json()
      onUpdate(updated)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const downloadAudio = () => {
    if (!audioSrc) return
    const a = document.createElement('a')
    a.href = audioSrc
    a.download = `${idea.id}_voice.mp3`
    a.click()
  }

  return (
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0E0E0E] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[idea.status]}`}>
              {VIRAL_STATUS_LABELS[idea.status]}
            </span>
            <span className="text-xs text-gray-500">{idea.platform.toUpperCase()} · {idea.duration_seconds}s · {idea.estimated_reach}</span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug">{idea.title}</h3>
          <p className="text-[#0077FF] text-xs mt-1 italic">"{idea.hook}"</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-white text-sm px-2 shrink-0"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[#1a1a1a] divide-y divide-[#1a1a1a]">
          {/* Script */}
          <div className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Scénář</div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">{idea.script}</pre>
          </div>

          {/* Visual notes */}
          <div className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Vizuální poznámky</div>
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans">{idea.visual_notes}</pre>
          </div>

          {/* Meta row */}
          <div className="p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-500 mb-1">Hudba</div>
              <div className="text-gray-300">{idea.music_suggestion}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">CTA</div>
              <div className="text-gray-300">{idea.cta}</div>
            </div>
          </div>

          {/* Hashtags */}
          <div className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Hashtagy</div>
            <div className="flex flex-wrap gap-1">
              {idea.hashtags.map((h, i) => (
                <span key={i} className="text-xs bg-[#0077FF]/10 text-[#4DA6FF] px-2 py-0.5 rounded">
                  {h.startsWith('#') ? h : '#' + h}
                </span>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Hlas (ElevenLabs)</div>
            {audioSrc ? (
              <div className="flex items-center gap-2">
                <audio controls src={audioSrc} className="flex-1 h-8" style={{ filter: 'invert(1) hue-rotate(180deg)' }} />
                <button onClick={downloadAudio} className="text-xs bg-[#1a1a1a] text-gray-300 px-2 py-1 rounded hover:bg-[#252525]">
                  ⬇ Stáhnout
                </button>
                <button onClick={generateVoice} disabled={loadingVoice} className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-1 rounded hover:bg-[#252525] disabled:opacity-50">
                  🔄
                </button>
              </div>
            ) : (
              <button
                onClick={generateVoice}
                disabled={loadingVoice}
                className="text-sm bg-[#0077FF]/10 border border-[#0077FF]/30 text-[#4DA6FF] px-4 py-2 rounded-lg hover:bg-[#0077FF]/20 disabled:opacity-50 transition-colors"
              >
                {loadingVoice ? '⏳ Generuju hlas...' : '🎙️ Vygenerovat hlas (ElevenLabs)'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={copyScript}
              className="text-sm bg-[#1a1a1a] text-gray-300 px-3 py-1.5 rounded-lg hover:bg-[#252525] transition-colors"
            >
              {copied ? '✅ Zkopírováno' : '📋 Kopírovat scénář'}
            </button>

            {(['scripted', 'recorded', 'posted'] as ViralStatus[])
              .filter(s => s !== idea.status)
              .map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updatingStatus}
                  className="text-sm bg-[#1a1a1a] text-gray-400 px-3 py-1.5 rounded-lg hover:bg-[#252525] disabled:opacity-50 transition-colors"
                >
                  → {VIRAL_STATUS_LABELS[s]}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
