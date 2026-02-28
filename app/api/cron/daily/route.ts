import { NextRequest, NextResponse } from 'next/server'
import { generateThreePosts } from '@/lib/claude'
import { savePost } from '@/lib/store'
import { getTodaySchedule } from '@/lib/schedule'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = getTodaySchedule()
    const posts = await generateThreePosts(today.dayOfWeek, today.weekNumber)
    posts.forEach(savePost)

    const BASE_URL = process.env.INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    for (const post of posts) {
      await fetch(`${BASE_URL}/api/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })
      await new Promise(r => setTimeout(r, 500))
    }

    return NextResponse.json({ success: true, post_ids: posts.map(p => p.id) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
