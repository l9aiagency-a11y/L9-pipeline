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
