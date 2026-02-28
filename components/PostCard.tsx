'use client'
import { useState } from 'react'
import { Post } from '@/lib/types'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'
import { POST_TYPE_LABELS, POST_TYPE_EMOJI } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

const TYPE_ACCENT: Record<string, string> = {
  educational:       'border-l-blue-500/50',
  social_proof:      'border-l-emerald-500/50',
  behind_the_scenes: 'border-l-violet-500/50',
  problem_solution:  'border-l-orange-500/50',
  promotional:       'border-l-[#0077FF]/70',
  inspirational:     'border-l-pink-500/50',
  tips_tricks:       'border-l-teal-500/50',
}

function scoreColor(s: number): string {
  if (s <= 5)  return 'bg-red-500/15 text-red-400 border-red-500/20'
  if (s <= 7)  return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
}

export function PostCard({ post, onUpdate }: { post: Post; onUpdate: (p: Post) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [voiceExpanded, setVoiceExpanded] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const dayLabel = WEEKLY_SCHEDULE[post.day_of_week].label
  const caption = expanded || post.ig_caption.length <= 140 ? post.ig_caption : post.ig_caption.slice(0, 140) + '…'
  const voicePreview = post.voiceover_script.length <= 100 ? post.voiceover_script : post.voiceover_script.slice(0, 100) + '…'
  const visibleTags = showAllTags ? post.hashtags : post.hashtags.slice(0, 8)
  const accent = TYPE_ACCENT[post.post_type] ?? 'border-l-white/10'

  const patch = async (action: string, body: object) => {
    setLoading(action)
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    onUpdate(await res.json())
    setLoading(null)
  }

  const sendWhatsApp = async () => {
    setLoading('wa')
    await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })
    setLoading(null)
  }

  const copyCaption = async () => {
    await navigator.clipboard.writeText(post.ig_caption + '\n\n' + post.hashtags.join(' '))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const regenerate = async () => {
    setLoading('regen')
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate_id: post.id }),
    })
    onUpdate(await res.json())
    setLoading(null)
  }

  return (
    <div className={`rounded-2xl border border-white/[0.06] border-l-2 ${accent} bg-[#0C0C0C] overflow-hidden`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{POST_TYPE_EMOJI[post.post_type]}</span>
          <div>
            <div className="text-sm font-semibold text-white">{POST_TYPE_LABELS[post.post_type]}</div>
            <div className="text-xs text-white/30">{dayLabel} · Týden {post.week_number}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Engagement score badge */}
          <div
            className={`group relative flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold cursor-default ${scoreColor(post.engagement_score)}`}
            title={post.engagement_reason}
          >
            <span>{post.engagement_score}</span>
            <span className="font-normal opacity-50">/10</span>
            {/* Tooltip */}
            <div className="pointer-events-none absolute right-0 top-full mt-1.5 z-10 w-52 rounded-lg bg-[#1A1A1A] border border-white/10 px-3 py-2 text-[11px] text-white/60 leading-snug opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              {post.engagement_reason}
            </div>
          </div>
          <StatusBadge status={post.status} />
        </div>
      </div>

      {/* Caption */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-sm leading-relaxed text-white/75 whitespace-pre-line">{caption}</p>
        {post.ig_caption.length > 140 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 text-xs text-[#4DA6FF]/60 hover:text-[#4DA6FF] transition-colors"
          >
            {expanded ? 'Méně' : 'Zobrazit vše'}
          </button>
        )}
      </div>

      {/* Voiceover script — expandable */}
      <div className="mx-5 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3.5 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-widest text-white/20 mb-1">🎙 Voiceover</div>
        <p className="text-xs text-white/55 whitespace-pre-line">
          {voiceExpanded ? post.voiceover_script : voicePreview}
        </p>
        {post.voiceover_script.length > 100 && (
          <button
            onClick={() => setVoiceExpanded(!voiceExpanded)}
            className="mt-1 text-[11px] text-[#4DA6FF]/50 hover:text-[#4DA6FF] transition-colors"
          >
            {voiceExpanded ? 'Méně' : 'Zobrazit vše'}
          </button>
        )}
      </div>

      {/* Video brief — each line as separate row */}
      <div className="mx-5 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3.5 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-widest text-white/20 mb-2">🎬 Video brief</div>
        <div className="flex flex-col gap-1">
          {post.video_brief.split('\n').filter(Boolean).map((line, i) => (
            <div
              key={i}
              className={`text-xs leading-snug ${i === 0 ? 'text-white/40 font-medium' : 'text-white/55'}`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {visibleTags.map((tag) => (
          <span key={tag} className="rounded-md px-2 py-0.5 text-[11px] bg-white/[0.05] text-white/35 font-mono">
            {tag}
          </span>
        ))}
        {!showAllTags && post.hashtags.length > 8 && (
          <button
            onClick={() => setShowAllTags(true)}
            className="rounded-md px-2 py-0.5 text-[11px] text-[#4DA6FF]/50 hover:text-[#4DA6FF] transition-colors"
          >
            +{post.hashtags.length - 8}
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="px-5 pb-4 flex items-center gap-3 text-[11px] text-white/25">
        <span>⏰ {post.best_time}</span>
        <span className="h-1 w-1 rounded-full bg-white/10" />
        <span>{post.cta}</span>
      </div>

      {/* Actions */}
      {post.status === 'pending_review' && (
        <div className="px-5 pb-4 pt-3 flex flex-wrap gap-2 border-t border-white/[0.04]">
          <Btn onClick={() => patch('approve', { status: 'approved', approved_at: new Date().toISOString() })} loading={loading === 'approve'} variant="green">Schválit</Btn>
          <Btn onClick={sendWhatsApp} loading={loading === 'wa'} variant="blue">WhatsApp</Btn>
          <Btn onClick={copyCaption} variant="ghost">{copied ? '✓ Zkopírováno' : 'Kopírovat'}</Btn>
          <Btn onClick={regenerate} loading={loading === 'regen'} variant="ghost">Regenerovat</Btn>
          <Btn onClick={() => patch('skip', { status: 'failed' })} loading={loading === 'skip'} variant="muted">Přeskočit</Btn>
        </div>
      )}
    </div>
  )
}

function Btn({ children, onClick, loading, variant = 'ghost' }: {
  children: React.ReactNode; onClick: () => void; loading?: boolean; variant?: 'green'|'blue'|'ghost'|'muted'
}) {
  const s = {
    green: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20',
    blue:  'bg-[#0077FF]/15 text-[#4DA6FF] hover:bg-[#0077FF]/25 border-[#0077FF]/20',
    ghost: 'bg-white/[0.05] text-white/45 hover:bg-white/[0.09] hover:text-white/65 border-white/[0.06]',
    muted: 'text-white/20 hover:text-white/35 border-transparent',
  }
  return (
    <button onClick={onClick} disabled={!!loading}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${s[variant]}`}>
      {loading && <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current/30 border-t-current" />}
      {children}
    </button>
  )
}
