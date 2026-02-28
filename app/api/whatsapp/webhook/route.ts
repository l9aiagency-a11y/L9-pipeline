import { NextRequest, NextResponse } from 'next/server'
import { getTodayByStatus, updatePost } from '@/lib/db'

// TwiML empty response — Twilio requires this to acknowledge receipt
function twiml(message?: string) {
  const msg = message
    ? `<Message>${message}</Message>`
    : ''
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${msg}</Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } }
  )
}

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

async function sendReply(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      To:   to,
      Body: body,
    }).toString(),
  })
}

// POST /api/whatsapp/webhook
// Twilio sends application/x-www-form-urlencoded with: Body, From, ButtonPayload, etc.
export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const from          = params.get('From') ?? ''
    const buttonPayload = params.get('ButtonPayload') ?? ''
    const body          = params.get('Body') ?? ''

    // ── Quick-reply button: "✅ Nahráno - Spustit render" ────────────────────
    if (buttonPayload === '✅ Nahráno - Spustit render') {
      const row = getTodayByStatus('waiting_for_video')
      if (!row) {
        await sendReply(from, '❌ Nenašel jsem dnešní post čekající na video.')
        return twiml()
      }

      const postId = row.id as string
      updatePost(postId, { status: 'rendering', render_started_at: new Date().toISOString() })

      // Kick off render pipeline
      const base = process.env.INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
      await fetch(`${base}/api/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      }).catch(err => console.error('Render trigger failed:', err))

      await sendReply(from, '⏳ Render spuštěn! Dostaneš zprávu až bude hotovo.')
      return twiml()
    }

    // ── Quick-reply button: "⏭️ Dnes nepublikuji" ────────────────────────────
    if (buttonPayload === '⏭️ Dnes nepublikuji') {
      const row = getTodayByStatus('waiting_for_video') ?? getTodayByStatus('approved')
      if (row) {
        updatePost(row.id as string, { status: 'failed' })
      }
      await sendReply(from, '⏭️ Ok, dnešní post přeskočen.')
      return twiml()
    }

    // ── Quick-reply button: "✅ Publikovat v 18:00" ───────────────────────────
    if (buttonPayload === '✅ Publikovat v 18:00') {
      const row = getTodayByStatus('ready_for_review')
      if (!row) {
        await sendReply(from, '❌ Nenašel jsem dnešní post připravený ke zveřejnění.')
        return twiml()
      }

      // 18:00 Prague winter time = 17:00 UTC
      const today = new Date()
      const scheduledFor = new Date(Date.UTC(
        today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 17, 0, 0
      )).toISOString()

      updatePost(row.id as string, { status: 'scheduled', scheduled_for: scheduledFor })
      await sendReply(from, '✅ Naplánováno! Post půjde live v 18:00 🚀')
      return twiml()
    }

    // ── Quick-reply button: "❌ Zamítnout" ────────────────────────────────────
    if (buttonPayload === '❌ Zamítnout') {
      const row = getTodayByStatus('ready_for_review')
      if (row) {
        updatePost(row.id as string, { status: 'failed' })
      }
      await sendReply(from, '❌ Zamítnuto. Post nebude zveřejněn.'  )
      return twiml()
    }

    // ── Text-body fallback for approve/skip/regenerate keywords ──────────────
    const lower = body.toLowerCase().trim()
    if (lower === 'approve' || lower === 'schválit') {
      // handled via link-based /api/whatsapp/action; acknowledge silently
      return twiml()
    }

    // Unknown message — acknowledge without reply
    return twiml()
  } catch (e) {
    console.error(e)
    // Always return valid TwiML so Twilio doesn't retry indefinitely
    return twiml()
  }
}
