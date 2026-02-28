import { NextRequest, NextResponse } from 'next/server'
import { generateViralIdea } from '@/lib/viral'
import { saveViralIdea } from '@/lib/store'
import { getSetting } from '@/lib/settings'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  const cronSecret = getSetting('cron_secret') || process.env.CRON_SECRET
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const idea = await generateViralIdea()
    saveViralIdea(idea)

    // Send to Telegram if configured
    const token = getSetting('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN
    const chatId = getSetting('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID
    if (token && chatId) {
      const msg = `🔥 <b>Virální nápad pro dnešek</b>\n\n<b>${idea.title}</b>\n\n🎣 <b>Hook:</b> ${idea.hook}\n\n🎬 <b>Délka:</b> ${idea.duration_seconds}s | ${idea.platform.toUpperCase()}\n📊 <b>Dosah:</b> ${idea.estimated_reach}\n\n<i>Otevři dashboard pro celý scénář a generaci hlasu.</i>`
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
      })
    }

    return NextResponse.json({ ok: true, id: idea.id })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
