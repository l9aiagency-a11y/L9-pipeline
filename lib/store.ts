import { Post, ViralIdea, MediaItem } from './types'
import { insertPost as dbInsert, updatePost as dbUpdate, getAllPosts as dbGetAll } from './db'

// ─── Posts store ─────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __posts: Map<string, Post> | undefined
  // eslint-disable-next-line no-var
  var __viral: Map<string, ViralIdea> | undefined
  // eslint-disable-next-line no-var
  var __media: Map<string, MediaItem> | undefined
  // eslint-disable-next-line no-var
  var __dbLoaded: boolean | undefined
}

const posts = globalThis.__posts ?? (globalThis.__posts = new Map<string, Post>())
const viral = globalThis.__viral ?? (globalThis.__viral = new Map<string, ViralIdea>())
const media = globalThis.__media ?? (globalThis.__media = new Map<string, MediaItem>())

// Hydrate from SQLite on cold start (server only)
if (!globalThis.__dbLoaded && globalThis.__posts!.size === 0) {
  try {
    const rows = dbGetAll()
    rows.forEach(row => {
      const p = {
        ...row,
        hashtags: typeof row.hashtags === 'string' ? JSON.parse(row.hashtags as string) : (row.hashtags ?? []),
        video_clips: typeof row.video_clips === 'string' ? JSON.parse(row.video_clips as string) : (row.video_clips ?? undefined),
      } as Post
      globalThis.__posts!.set(p.id, p)
    })
  } catch {
    // DB may not exist yet on first run
  }
  globalThis.__dbLoaded = true
}

// Posts
export function getAllPosts(): Post[] {
  return Array.from(posts.values()).sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  )
}
export function getPost(id: string): Post | undefined { return posts.get(id) }
export function savePost(post: Post): void {
  posts.set(post.id, post)
  try { dbInsert(post as unknown as Record<string, unknown>) } catch { /* non-fatal */ }
}
export function updatePost(id: string, updates: Partial<Post>): Post | undefined {
  const post = posts.get(id)
  if (!post) return undefined
  const updated = { ...post, ...updates }
  posts.set(id, updated)
  try { dbUpdate(id, updates as Record<string, unknown>) } catch { /* non-fatal */ }
  return updated
}

// ─── Specialized queries (in-memory equivalents of db.ts functions) ──────────

export function getPostByRenderId(renderId: string): Post | undefined {
  return Array.from(posts.values()).find(p => p.render_id === renderId)
}

export function getPostsByStatus(status: string): Post[] {
  return Array.from(posts.values())
    .filter(p => p.status === status)
    .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
}

export function getTodayApproved(): Post | undefined {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const wn = weekNum(today)
  return Array.from(posts.values()).find(
    p => p.day_of_week === dayOfWeek && p.week_number === wn && p.status === 'approved'
  )
}

export function getTodayByStatus(status: string): Post | undefined {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const wn = weekNum(today)
  return Array.from(posts.values()).find(
    p => p.day_of_week === dayOfWeek && p.week_number === wn && p.status === status
  )
}

export function getPostsDue(now: string): Post[] {
  const threshold = new Date(now).getTime()
  return Array.from(posts.values()).filter(
    p => p.status === 'scheduled' && p.scheduled_for && new Date(p.scheduled_for).getTime() <= threshold
  )
}

// Avoids circular dependency with lib/schedule.ts
function weekNum(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Viral Ideas
export function getAllViralIdeas(): ViralIdea[] {
  return Array.from(viral.values()).sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  )
}
export function getViralIdea(id: string): ViralIdea | undefined { return viral.get(id) }
export function saveViralIdea(idea: ViralIdea): void { viral.set(idea.id, idea) }
export function updateViralIdea(id: string, updates: Partial<ViralIdea>): ViralIdea | undefined {
  const idea = viral.get(id)
  if (!idea) return undefined
  const updated = { ...idea, ...updates }
  viral.set(id, updated)
  return updated
}

// Media
export function getAllMedia(): MediaItem[] {
  return Array.from(media.values()).sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  )
}
export function getMediaItem(id: string): MediaItem | undefined { return media.get(id) }
export function saveMediaItem(item: MediaItem): void { media.set(item.id, item) }
export function deleteMediaItem(id: string): boolean { return media.delete(id) }
