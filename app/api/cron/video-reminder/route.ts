import { NextRequest, NextResponse } from 'next/server'
import { getTodayApproved } from '@/lib/store'
import { updatePost } from '@/lib/store'

export const maxDuration = 30

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const row = getTodayApproved()
    if (!row) {
      return NextResponse.json({ skipped: true })
    }

    const base = process.env.INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''
    const postId = row.id

    const body =
      `🎬 *Čas natočit záběry!*\n\n` +
      `${row.video_brief}\n\n` +
      `Až nahraješ videa do Dropboxu 👇`

    const params = new URLSearchParams({
      From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      To:   `whatsapp:${process.env.WHATSAPP_TO}`,
      Body: body,
    })

    // Quick-reply / CTA buttons via PersistentAction
    params.append('PersistentAction[0]', `url:✅ Nahráno - Spustit render:${base}/api/whatsapp/action?action=uploaded&id=${postId}`)
    params.append('PersistentAction[1]', `url:⏭️ Dnes nepublikuji:${base}/api/whatsapp/action?action=skip&id=${postId}`)

    const sid = process.env.TWILIO_ACCOUNT_SID!
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: twilioAuth(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Twilio error ${res.status}: ${err}`)
    }

    // Transition post to waiting_for_video
    updatePost(postId, { status: 'waiting_for_video' })

    return NextResponse.json({ success: true, post_id: postId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Video reminder failed', detail: (e as Error).message }, { status: 500 })
  }
}
