import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = '/tmp/l9-pipeline.db'

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      post_type TEXT,
      day_of_week INTEGER,
      week_number INTEGER,
      ig_caption TEXT,
      hashtags TEXT,
      voiceover_script TEXT,
      video_brief TEXT,
      engagement_score INTEGER,
      engagement_reason TEXT,
      best_time TEXT,
      cta TEXT,
      status TEXT DEFAULT 'pending_review',
      generated_at TEXT,
      approved_at TEXT,
      video_uploaded_at TEXT,
      render_started_at TEXT,
      render_completed_at TEXT,
      video_url TEXT,
      cover_url TEXT,
      scheduled_for TEXT,
      posted_at TEXT,
      instagram_post_id TEXT,
      regeneration_count INTEGER DEFAULT 0,
      whatsapp_message_sid TEXT,
      render_id TEXT
    )
  `)
  // Add render_id to existing DBs that predate this column
  try { _db.exec(`ALTER TABLE posts ADD COLUMN render_id TEXT`) } catch { /* already exists */ }
  return _db
}

export function insertPost(post: Record<string, unknown>): void {
  const db = getDb()
  const keys = Object.keys(post)
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map(k => {
    const v = post[k]
    return Array.isArray(v) ? JSON.stringify(v) : v
  })
  db.prepare(`INSERT OR REPLACE INTO posts (${keys.join(', ')}) VALUES (${placeholders})`).run(values)
}

export function getPost(id: string): Record<string, unknown> | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as Record<string, unknown> | undefined
}

export function updatePost(id: string, fields: Record<string, unknown>): void {
  const db = getDb()
  const keys = Object.keys(fields)
  if (keys.length === 0) return
  const set = keys.map(k => `${k} = ?`).join(', ')
  const values = keys.map(k => {
    const v = fields[k]
    return Array.isArray(v) ? JSON.stringify(v) : v
  })
  db.prepare(`UPDATE posts SET ${set} WHERE id = ?`).run([...values, id])
}

export function getTodayApproved(): Record<string, unknown> | undefined {
  const db = getDb()
  const today = new Date()
  const dayOfWeek = today.getDay()
  const jan1 = new Date(today.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((today.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return db.prepare(
    `SELECT * FROM posts WHERE day_of_week = ? AND week_number = ? AND status = 'approved' LIMIT 1`
  ).get(dayOfWeek, weekNumber) as Record<string, unknown> | undefined
}

export function getTodayByStatus(status: string): Record<string, unknown> | undefined {
  const db = getDb()
  const today = new Date()
  const dayOfWeek = today.getDay()
  const jan1 = new Date(today.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((today.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return db.prepare(
    `SELECT * FROM posts WHERE day_of_week = ? AND week_number = ? AND status = ? LIMIT 1`
  ).get(dayOfWeek, weekNumber, status) as Record<string, unknown> | undefined
}

export function getAllPosts(): Record<string, unknown>[] {
  const db = getDb()
  return db.prepare('SELECT * FROM posts ORDER BY generated_at DESC').all() as Record<string, unknown>[]
}

export function getPostsByStatus(status: string): Record<string, unknown>[] {
  const db = getDb()
  return db.prepare('SELECT * FROM posts WHERE status = ? ORDER BY generated_at DESC').all(status) as Record<string, unknown>[]
}

export function getPostByRenderId(renderId: string): Record<string, unknown> | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM posts WHERE render_id = ? LIMIT 1').get(renderId) as Record<string, unknown> | undefined
}

export function getPostsDue(now: string): Record<string, unknown>[] {
  const db = getDb()
  return db.prepare(
    `SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_for <= ?`
  ).all(now) as Record<string, unknown>[]
}
