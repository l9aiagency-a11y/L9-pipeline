import { NextRequest, NextResponse } from 'next/server'
import { getPostsDue } from '@/lib/store'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date().toISOString()
  const due = getPostsDue(now)

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  let published = 0

  for (const post of due) {
    try {
      const res = await fetch(`${base}/api/instagram/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id }),
      })
      if (res.ok) {
        published++
      } else {
        const err = await res.text()
        console.error(`Failed to publish post ${post.id}:`, err)
      }
    } catch (e) {
      console.error(`Error publishing post ${post.id}:`, e)
    }
  }

  return NextResponse.json({ success: true, published })
}
