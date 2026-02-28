import { NextRequest, NextResponse } from 'next/server'
import { generatePost, generateThreePosts, regeneratePost } from '@/lib/claude'
import { savePost, getPost } from '@/lib/store'
import { insertPost } from '@/lib/db'
import { getTodaySchedule } from '@/lib/schedule'

export const maxDuration = 180

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const today = getTodaySchedule()
    const dayOfWeek = body.day_of_week ?? today.dayOfWeek
    const weekNumber = body.week_number ?? today.weekNumber

    // Bulk generation: { count: 3 } → 3 variants at 35s/50s/65s read time
    if (body.count && body.count > 1) {
      const posts = await generateThreePosts(dayOfWeek, weekNumber)
      posts.forEach(p => { savePost(p); insertPost(p as unknown as Record<string, unknown>) })
      return NextResponse.json(posts)
    }

    // Single post (default)
    let post
    if (body.regenerate_id) {
      const existing = getPost(body.regenerate_id)
      if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      post = await regeneratePost(existing)
    } else {
      post = await generatePost(dayOfWeek, weekNumber)
    }

    savePost(post)
    insertPost(post as unknown as Record<string, unknown>)
    return NextResponse.json(post)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Generation failed', detail: (e as Error).message }, { status: 500 })
  }
}
