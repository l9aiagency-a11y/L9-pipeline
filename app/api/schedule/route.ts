import { NextRequest, NextResponse } from 'next/server'
import { getPost } from '@/lib/store'

// MVP: Copy-paste export (Instagram Graph API not yet implemented)
export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json()
    const post = getPost(post_id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const hashtags = post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')

    const copyText = [
      post.ig_caption,
      '',
      hashtags,
      '',
      `⏰ Nejlepší čas: ${post.best_time}`,
    ].join('\n')

    return NextResponse.json({ copy_text: copyText })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
