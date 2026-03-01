import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPostByRenderId, updatePost, getAllPosts } from '@/lib/store'

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

async function sendWhatsApp(body: string, persistentActions?: string[]) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const params = new URLSearchParams({
    From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    To:   `whatsapp:${process.env.WHATSAPP_TO}`,
    Body: body,
  })
  if (persistentActions) {
    persistentActions.forEach((action, i) => {
      params.append(`PersistentAction[${i}]`, action)
    })
  }
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  console.log('[WEBHOOK] Creatomate webhook received, rawBody:', rawBody)

  // Temporarily disabled signature validation for debugging
  // const secret = process.env.CREATOMATE_WEBHOOK_SECRET
  // if (secret) {
  //   const signature = req.headers.get('x-creatomate-signature') ?? ''
  //   const expected = crypto
  //     .createHmac('sha256', secret)
  //     .update(rawBody)
  //     .digest('hex')
  //   if (signature !== expected) {
  //     console.log('[WEBHOOK] Signature mismatch! header:', signature, 'expected:', expected)
  //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  //   }
  // }

  let payload: { id: string; status: string; url?: string; snapshot_url?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    console.error('[WEBHOOK] Failed to parse JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id: renderId, status, url, snapshot_url } = payload
  console.log('[WEBHOOK] Parsed payload — renderId:', renderId, 'status:', status, 'url:', url)

  // Log all posts in store for debugging
  const allPosts = getAllPosts()
  console.log('[WEBHOOK] Total posts in store:', allPosts.length)
  console.log('[WEBHOOK] Posts with render_id:', allPosts.filter(p => p.render_id).map(p => ({ id: p.id, render_id: p.render_id, status: p.status })))

  if (status === 'succeeded') {
    const row = getPostByRenderId(renderId)
    console.log('[WEBHOOK] getPostByRenderId result:', row ? { id: row.id, status: row.status, render_id: row.render_id } : 'NOT FOUND')

    if (!row) {
      console.warn(`[WEBHOOK] No post found for render_id=${renderId} — store may have lost state (serverless cold start)`)
      return NextResponse.json({ ok: true, warning: 'post not found' })
    }

    console.log('[WEBHOOK] Updating post', row.id, 'from', row.status, 'to ready_for_review')
    updatePost(row.id, {
      video_url: url,
      cover_url: snapshot_url,
      status: 'ready_for_review',
      render_completed_at: new Date().toISOString(),
    })
    console.log('[WEBHOOK] Post updated successfully')

    await sendWhatsApp(
      `🎬 *Video je hotové!*\n\n` +
      `Zkontroluj před zveřejněním na Instagramu 👇\n` +
      `${url ?? '–'}\n\n` +
      `Publikovat v 18:00?`,
      [
        `reply:✅ Publikovat v 18:00`,
        `reply:❌ Zamítnout`,
      ]
    ).catch(err => console.error('[WEBHOOK] WhatsApp notify failed:', err))
  }

  if (status === 'failed') {
    const row = getPostByRenderId(renderId)
    console.log('[WEBHOOK] Failed render — post found:', row ? row.id : 'NOT FOUND')
    if (row) {
      updatePost(row.id, { status: 'failed' })
    }
    console.error(`[WEBHOOK] Creatomate render failed: renderId=${renderId}`)
  }

  console.log('[WEBHOOK] Done, returning ok')
  return NextResponse.json({ ok: true })
}
