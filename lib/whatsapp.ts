import { Post, POST_TYPE_EMOJI } from './types'
import { WEEKLY_SCHEDULE } from './schedule'

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

export async function sendWhatsAppPost(post: Post): Promise<void> {
  const from = process.env.TWILIO_WHATSAPP_FROM! // e.g. whatsapp:+14155238886
  const to   = process.env.WHATSAPP_TO!           // e.g. whatsapp:+420xxxxxxxxx
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  const dayLabel = WEEKLY_SCHEDULE[post.day_of_week].label
  const emoji    = POST_TYPE_EMOJI[post.post_type]

  // Estimate video read duration: Czech speech ~130 words/min = ~2.17 words/sec
  const wordCount = post.ig_caption.trim().split(/\s+/).length
  const estSeconds = Math.round(wordCount / 2.17)

  const body = [
    `wagwan nigga ${emoji} · ${dayLabel}`,
    `📝 ${wordCount} slov · ⏱ ~${estSeconds}s video · 📊 ${post.engagement_score}/100`,
    '',
    post.ig_caption,
    '',
    `⏰ ${post.best_time}  ·  ${post.cta}`,
    '',
    '─────────────────',
    `✅ Schválit → ${base}/api/whatsapp/action?action=approve&id=${post.id}`,
    `🔄 Regenerovat → ${base}/api/whatsapp/action?action=regenerate&id=${post.id}`,
    `⏭️ Přeskočit → ${base}/api/whatsapp/action?action=skip&id=${post.id}`,
  ].join('\n')

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: twilioAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twilio error ${res.status}: ${err}`)
  }
}
