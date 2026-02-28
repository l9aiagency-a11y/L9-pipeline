import { NextRequest, NextResponse } from 'next/server'
import { getWeeklyInsights } from '@/lib/instagram-insights'

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

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const insights = await getWeeklyInsights()

    if (insights.totalReach === 0) {
      await sendWhatsApp('📊 Tento týden nebyly žádné zveřejněné posty.')
      return NextResponse.json({ success: true, posted: 0 })
    }

    const message =
      `📊 *Týdenní report L9 AI Studios*\n\n` +
      `🏆 Nejlepší post: ${insights.topPost.url}\n` +
      `👁️ Reach: ${insights.totalReach}\n` +
      `❤️ Likes: ${insights.totalLikes}\n` +
      `🔖 Saves: ${insights.totalSaves}\n` +
      `📈 Avg engagement: ${insights.avgEngagement}%\n\n` +
      `💡 Doporučení: ${insights.recommendation}`

    await sendWhatsApp(message)
    return NextResponse.json({ success: true, insights })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('Weekly report error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
