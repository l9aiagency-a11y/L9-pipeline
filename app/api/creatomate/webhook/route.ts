import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPostByRenderId, updatePost } from '@/lib/store'

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

  // Validate Creatomate webhook signature if secret is configured
  const secret = process.env.CREATOMATE_WEBHOOK_SECRET
  if (secret) {
    const signature = req.headers.get('x-creatomate-signature') ?? ''
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: { id: string; status: string; url?: string; snapshot_url?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id: renderId, status, url, snapshot_url } = payload

  if (status === 'succeeded') {
    const row = getPostByRenderId(renderId)
    if (!row) {
      console.warn(`Creatomate webhook: no post found for render_id=${renderId}`)
      return NextResponse.json({ ok: true })
    }

    updatePost(row.id, {
      video_url: url,
      cover_url: snapshot_url,
      status: 'ready_for_review',
      render_completed_at: new Date().toISOString(),
    })

    await sendWhatsApp(
      `🎬 *Video je hotové!*\n\n` +
      `Zkontroluj před zveřejněním na Instagramu 👇\n` +
      `${url ?? '–'}\n\n` +
      `Publikovat v 18:00?`,
      [
        `reply:✅ Publikovat v 18:00`,
        `reply:❌ Zamítnout`,
      ]
    ).catch(err => console.error('WhatsApp notify failed:', err))
  }

  if (status === 'failed') {
    const row = getPostByRenderId(renderId)
    if (row) {
      updatePost(row.id, { status: 'failed' })
    }
    console.error(`Creatomate render failed: renderId=${renderId}`)
  }

  return NextResponse.json({ ok: true })
}
