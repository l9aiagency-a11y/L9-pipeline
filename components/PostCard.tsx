'use client'
import { useState, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { Post } from '@/lib/types'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'
import { POST_TYPE_LABELS, POST_TYPE_EMOJI } from '@/lib/types'
import { StatusBadge } from './StatusBadge'
import { Loader2 } from 'lucide-react'

const TYPE_ACCENT: Record<string, string> = {
  educational:       'border-l-blue-500/40',
  social_proof:      'border-l-green-500/40',
  behind_the_scenes: 'border-l-purple-500/40',
  problem_solution:  'border-l-orange-500/40',
  promotional:       'border-l-primary/40',
  inspirational:     'border-l-pink-500/40',
  tips_tricks:       'border-l-teal-500/40',
}

function scoreColor(s: number): string {
  if (s <= 5)  return 'bg-red-500/15 text-red-400 border-red-500/20'
  if (s <= 7)  return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
  return 'bg-green-500/15 text-green-400 border-green-500/20'
}

export function PostCard({ post, onUpdate }: { post: Post; onUpdate: (p: Post) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [voiceExpanded, setVoiceExpanded] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const dayLabel = WEEKLY_SCHEDULE[post.day_of_week].label
  const caption = expanded || post.ig_caption.length <= 140 ? post.ig_caption : post.ig_caption.slice(0, 140) + '\u2026'
  const voicePreview = post.voiceover_script.length <= 100 ? post.voiceover_script : post.voiceover_script.slice(0, 100) + '\u2026'
  const visibleTags = showAllTags ? post.hashtags : post.hashtags.slice(0, 8)
  const accent = TYPE_ACCENT[post.post_type] ?? 'border-l-border'

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

  const uploadVideos = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return
    setLoading('upload')
    setUploadProgress(0)

    const files = Array.from(uploadFiles)
    const urls: string[] = [...(post.video_clips ?? [])]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop() ?? 'mp4'
      const pathname = `l9-videos/${post.id}_clip${urls.length}.${ext}`

      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/media/upload-url',
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          const fileProgress = (i / files.length + percentage / 100 / files.length) * 100
          setUploadProgress(Math.round(fileProgress))
        },
      })
      urls.push(blob.url)
    }

    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_clips: urls,
        video_uploaded_at: new Date().toISOString(),
      }),
    })
    if (res.ok) {
      onUpdate(await res.json())
    }

    setUploadFiles(null)
    setUploadProgress(0)
    if (fileRef.current) fileRef.current.value = ''
    setLoading(null)
  }

  const startRender = async () => {
    setLoading('render')
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    })
    if (res.ok) {
      const data = await res.json()
      onUpdate({ ...post, status: 'rendering', render_id: data.render_id })
    }
    setLoading(null)
  }

  const publishNow = async () => {
    setLoading('publish')
    const res = await fetch('/api/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    })
    if (res.ok) {
      const data = await res.json()
      onUpdate({ ...post, status: 'posted', instagram_post_id: data.instagramPostId, posted_at: new Date().toISOString() })
    }
    setLoading(null)
  }

  const schedulePost = async () => {
    setLoading('schedule')
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    })
    if (res.ok) {
      onUpdate(await res.json())
    }
    setLoading(null)
  }

  const clipCount = post.video_clips?.length ?? 0

  return (
    <div className={`rounded-2xl border border-border border-l-2 ${accent} bg-card overflow-hidden`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{POST_TYPE_EMOJI[post.post_type]}</span>
          <div>
            <div className="text-sm font-medium text-foreground">{POST_TYPE_LABELS[post.post_type]}</div>
            <div className="text-xs text-muted-foreground">{dayLabel} &middot; Tyden {post.week_number}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`group relative flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold cursor-default ${scoreColor(post.engagement_score)}`}
            title={post.engagement_reason}
          >
            <span>{post.engagement_score}</span>
            <span className="font-normal opacity-50">/10</span>
            <div className="pointer-events-none absolute right-0 top-full mt-1.5 z-10 w-52 rounded-lg bg-card border border-border px-3 py-2 text-[11px] text-muted-foreground leading-snug opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              {post.engagement_reason}
            </div>
          </div>
          <StatusBadge status={post.status} />
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm leading-relaxed text-foreground/75 whitespace-pre-line">{caption}</p>
        {post.ig_caption.length > 140 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 text-xs text-primary/60 hover:text-primary transition-colors"
          >
            {expanded ? 'Mene' : 'Zobrazit vse'}
          </button>
        )}
      </div>

      {/* Voiceover script */}
      <div className="mx-4 mb-3 rounded-xl bg-muted/50 border border-border px-3.5 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1">Voiceover</div>
        <p className="text-xs text-foreground/55 whitespace-pre-line">
          {voiceExpanded ? post.voiceover_script : voicePreview}
        </p>
        {post.voiceover_script.length > 100 && (
          <button
            onClick={() => setVoiceExpanded(!voiceExpanded)}
            className="mt-1 text-[11px] text-primary/50 hover:text-primary transition-colors"
          >
            {voiceExpanded ? 'Mene' : 'Zobrazit vse'}
          </button>
        )}
      </div>

      {/* Video brief */}
      <div className="mx-4 mb-3 rounded-xl bg-muted/50 border border-border px-3.5 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Video brief</div>
        <div className="flex flex-col gap-1">
          {post.video_brief.split('\n').filter(Boolean).map((line, i) => (
            <div
              key={i}
              className={`text-xs leading-snug ${i === 0 ? 'text-muted-foreground font-medium' : 'text-foreground/55'}`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {visibleTags.map((tag) => (
          <span key={tag} className="rounded-md px-2 py-0.5 text-[11px] bg-muted text-muted-foreground font-mono">
            {tag}
          </span>
        ))}
        {!showAllTags && post.hashtags.length > 8 && (
          <button
            onClick={() => setShowAllTags(true)}
            className="rounded-md px-2 py-0.5 text-[11px] text-primary/50 hover:text-primary transition-colors"
          >
            +{post.hashtags.length - 8}
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="px-4 pb-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{post.best_time}</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>{post.cta}</span>
      </div>

      {/* Video preview for ready_for_review */}
      {post.status === 'ready_for_review' && post.video_url && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden aspect-video bg-background">
          <video src={post.video_url} controls className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2 border-t border-border">

        {/* pending_review */}
        {post.status === 'pending_review' && (
          <>
            <Btn onClick={() => patch('approve', { status: 'approved', approved_at: new Date().toISOString() })} loading={loading === 'approve'} variant="primary">Schvalit</Btn>
            <Btn onClick={sendWhatsApp} loading={loading === 'wa'} variant="secondary">WhatsApp</Btn>
            <Btn onClick={copyCaption} variant="secondary">{copied ? 'Zkopirovano' : 'Kopirovat'}</Btn>
            <Btn onClick={regenerate} loading={loading === 'regen'} variant="secondary">Regenerovat</Btn>
            <Btn onClick={() => patch('skip', { status: 'failed' })} loading={loading === 'skip'} variant="danger">Preskocit</Btn>
          </>
        )}

        {/* approved / waiting_for_video */}
        {(post.status === 'approved' || post.status === 'waiting_for_video') && (
          <>
            <div className="w-full flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                multiple
                onChange={e => setUploadFiles(e.target.files)}
                className="text-xs text-muted-foreground file:mr-2 file:rounded-full file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:text-foreground/50 file:cursor-pointer"
              />
            </div>
            {uploadFiles && uploadFiles.length > 0 && (
              <Btn onClick={uploadVideos} loading={loading === 'upload'} variant="primary">
                {loading === 'upload'
                  ? `Nahravam ${uploadProgress}%`
                  : `Nahrat ${uploadFiles.length} ${uploadFiles.length === 1 ? 'video' : 'videa'}`}
              </Btn>
            )}
            {clipCount > 0 && (
              <Btn onClick={startRender} loading={loading === 'render'} variant="primary">
                Spustit render ({clipCount} {clipCount === 1 ? 'klip' : 'klipy'})
              </Btn>
            )}
            <div className="text-[11px] text-muted-foreground w-full">
              {clipCount > 0
                ? `${clipCount} klip(u) nahrano`
                : 'Zatim zadne klipy'}
            </div>
          </>
        )}

        {/* rendering */}
        {post.status === 'rendering' && (
          <div className="w-full">
            <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Renderuje se...
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-500/50 rounded-full animate-pulse w-2/3" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Muze trvat 2-5 minut</div>
          </div>
        )}

        {/* ready_for_review */}
        {post.status === 'ready_for_review' && (
          <>
            {post.video_url && (
              <a href={post.video_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all">
                Nahled videa
              </a>
            )}
            <Btn onClick={publishNow} loading={loading === 'publish'} variant="primary">Publikovat ted</Btn>
            <Btn onClick={schedulePost} loading={loading === 'schedule'} variant="secondary">Naplanovat (18:00)</Btn>
            <Btn onClick={copyCaption} variant="secondary">{copied ? 'Zkopirovano' : 'Kopirovat'}</Btn>
          </>
        )}

        {/* scheduled */}
        {post.status === 'scheduled' && (
          <>
            <div className="text-xs text-cyan-400">
              Naplanovano: {post.scheduled_for ? new Date(post.scheduled_for).toLocaleString('cs-CZ') : '\u2013'}
            </div>
            <Btn onClick={() => patch('cancel', { status: 'ready_for_review', scheduled_for: null })} loading={loading === 'cancel'} variant="danger">Zrusit planovani</Btn>
          </>
        )}

        {/* posted */}
        {post.status === 'posted' && (
          <div className="text-xs text-green-400">
            Zverejneno {post.posted_at ? new Date(post.posted_at).toLocaleString('cs-CZ') : ''}
          </div>
        )}

        {/* failed */}
        {post.status === 'failed' && (
          <div className="text-xs text-red-400/60">Post preskocen nebo selhal</div>
        )}

      </div>
    </div>
  )
}

function Btn({ children, onClick, loading, variant = 'secondary' }: {
  children: React.ReactNode; onClick: () => void; loading?: boolean; variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles = {
    primary:   'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border border-border text-muted-foreground hover:border-primary hover:text-primary bg-transparent',
    danger:    'border border-red-500/20 text-red-400 hover:border-red-500 bg-transparent',
  }
  return (
    <button onClick={onClick} disabled={!!loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}>
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      {children}
    </button>
  )
}
