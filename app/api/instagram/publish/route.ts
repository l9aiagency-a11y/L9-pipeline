import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost } from '@/lib/store'
import { publishReel } from '@/lib/instagram'

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

async function sendWhatsApp(body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      To:   `whatsapp:${process.env.WHATSAPP_TO}`,
      Body: body,
    }).toString(),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json() as { post_id: string }
    if (!post_id) {
      return NextResponse.json({ error: 'post_id required' }, { status: 400 })
    }

    const post = getPost(post_id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'ready_for_review' && post.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Post status is '${post.status}', expected 'ready_for_review' or 'scheduled'` },
        { status: 400 }
      )
    }

    const hashtags = post.hashtags.join(' ')
    const caption = [post.ig_caption, hashtags].filter(Boolean).join('\n\n')

    const { instagramPostId } = await publishReel({
      videoUrl:  post.video_url!,
      coverUrl:  post.cover_url!,
      caption,
      postId:    post_id,
    })

    updatePost(post_id, {
      status: 'posted',
      posted_at: new Date().toISOString(),
      instagram_post_id: instagramPostId,
    })

    await sendWhatsApp(
      `✅ Zveřejněno!\n\ninstagram.com/p/${instagramPostId}`
    ).catch(err => console.error('WhatsApp notify failed:', err))

    return NextResponse.json({ success: true, instagramPostId })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('Instagram publish error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
