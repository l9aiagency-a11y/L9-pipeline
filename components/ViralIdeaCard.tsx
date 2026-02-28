'use client'
import { useState } from 'react'
import { ViralIdea, ViralStatus, VIRAL_STATUS_LABELS } from '@/lib/types'
import { Copy, Check, Download, RefreshCw, Loader2 } from 'lucide-react'

const STATUS_COLORS: Record<ViralStatus, string> = {
  new: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  scripted: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  recorded: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  posted: 'bg-green-500/15 text-green-400 border border-green-500/20',
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
        alert('Chyba: ' + (data.error || 'Neznama chyba'))
      }
    } catch {
      alert('Nepodarilo se vygenerovat hlas')
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
    <div className="bg-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[idea.status]}`}>
              {VIRAL_STATUS_LABELS[idea.status]}
            </span>
            <span className="text-xs text-muted-foreground">{idea.platform.toUpperCase()} &middot; {idea.duration_seconds}s &middot; {idea.estimated_reach}</span>
          </div>
          <h3 className="font-medium text-sm text-foreground leading-snug">{idea.title}</h3>
          <p className="text-primary text-xs mt-1 italic">&ldquo;{idea.hook}&rdquo;</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground text-sm px-2 shrink-0 transition-colors"
        >
          {expanded ? '\u25B2' : '\u25BC'}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {/* Script */}
          <div className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Scenar</div>
            <pre className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed font-sans">{idea.script}</pre>
          </div>

          {/* Visual notes */}
          <div className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Vizualni poznamky</div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{idea.visual_notes}</pre>
          </div>

          {/* Meta row */}
          <div className="p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Hudba</div>
              <div className="text-foreground/80">{idea.music_suggestion}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">CTA</div>
              <div className="text-foreground/80">{idea.cta}</div>
            </div>
          </div>

          {/* Hashtags */}
          <div className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Hashtagy</div>
            <div className="flex flex-wrap gap-1.5">
              {idea.hashtags.map((h, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  {h.startsWith('#') ? h : '#' + h}
                </span>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Hlas (ElevenLabs)</div>
            {audioSrc ? (
              <div className="flex items-center gap-2">
                <audio controls src={audioSrc} className="flex-1 h-8" style={{ filter: 'invert(1) hue-rotate(180deg)' }} />
                <button onClick={downloadAudio} className="text-xs rounded-full border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-primary transition-colors">
                  <Download className="h-3 w-3" />
                </button>
                <button onClick={generateVoice} disabled={loadingVoice} className="text-xs rounded-full border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                  <RefreshCw className={`h-3 w-3 ${loadingVoice ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <button
                onClick={generateVoice}
                disabled={loadingVoice}
                className="text-sm bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-xl hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loadingVoice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generuji hlas...
                  </>
                ) : (
                  'Vygenerovat hlas (ElevenLabs)'
                )}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={copyScript}
              className="text-xs rounded-full border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Zkopirovano' : 'Kopirovat scenar'}
            </button>

            {(['scripted', 'recorded', 'posted'] as ViralStatus[])
              .filter(s => s !== idea.status)
              .map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updatingStatus}
                  className="text-xs rounded-full border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
                >
                  &rarr; {VIRAL_STATUS_LABELS[s]}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
