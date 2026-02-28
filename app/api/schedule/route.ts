import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost } from '@/lib/store'

export async function POST(req: NextRequest) {
  try {
    const { post_id, scheduled_for } = await req.json()
    if (!post_id) {
      return NextResponse.json({ error: 'post_id required' }, { status: 400 })
    }

    const post = getPost(post_id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'ready_for_review') {
      return NextResponse.json(
        { error: `Post status is '${post.status}', expected 'ready_for_review'` },
        { status: 400 }
      )
    }

    // Default: schedule for 18:00 Prague time today (17:00 UTC in winter, 16:00 UTC in summer)
    let scheduledIso = scheduled_for
    if (!scheduledIso) {
      const today = new Date()
      scheduledIso = new Date(Date.UTC(
        today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 17, 0, 0
      )).toISOString()
    }

    const updated = updatePost(post_id, {
      status: 'scheduled',
      scheduled_for: scheduledIso,
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
