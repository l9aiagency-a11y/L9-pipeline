import { NextRequest, NextResponse } from 'next/server'
import { getTodayApproved } from '@/lib/store'

export const maxDuration = 30

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

async function sendMessage(body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
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
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twilio error ${res.status}: ${err}`)
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = getTodayApproved()
    if (!post) {
      return NextResponse.json({ skipped: true })
    }

    const hashtags = post.hashtags.slice(0, 10).join(' ')

    // Message 1: caption + first 10 hashtags
    const msg1 =
      `✅ *Schválený post pro dnešek*\n\n` +
      `📝 *Caption:*\n${post.ig_caption}\n\n` +
      `#️⃣ *Hashtagy:*\n${hashtags}`

    await sendMessage(msg1)

    await new Promise(r => setTimeout(r, 500))

    // Message 2: full voiceover + full video brief
    const msg2 =
      `🎙️ *Voiceover script:*\n${post.voiceover_script}\n\n` +
      `🎬 *Video brief:*\n${post.video_brief}`

    await sendMessage(msg2)

    return NextResponse.json({ success: true, post_id: post.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Reminder failed', detail: (e as Error).message }, { status: 500 })
  }
}
