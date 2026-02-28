import { NextRequest, NextResponse } from 'next/server'
import { Post, POST_TYPE_EMOJI, POST_TYPE_LABELS } from '@/lib/types'
import { WEEKLY_SCHEDULE } from '@/lib/schedule'

export async function POST(req: NextRequest) {
  try {
    const post: Post = await req.json()
    const token = process.env.TELEGRAM_BOT_TOKEN!
    const chatId = process.env.TELEGRAM_CHAT_ID!
    const dayLabel = WEEKLY_SCHEDULE[post.day_of_week].label
    const emoji = POST_TYPE_EMOJI[post.post_type]
    const typeLabel = POST_TYPE_LABELS[post.post_type]

    const text = [
      `${emoji} <b>${typeLabel}</b> · ${dayLabel} · Týden ${post.week_number}`,
      '',
      post.ig_caption,
      '',
      `📌 <i>${post.hashtags.slice(0, 5).join(' ')}</i>`,
      '',
      `🎬 <b>Video brief:</b>`,
      post.video_brief,
      '',
      `🎙 <b>Voiceover:</b>`,
      post.voiceover_script,
      '',
      `📊 Engagement score: <b>${post.engagement_score}/100</b> · ${post.engagement_reason}`,
      '',
      `⏰ ${post.best_time} · <b>CTA:</b> ${post.cta}`,
    ].join('\n')

    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Schválit', callback_data: `approve:${post.id}` },
        { text: '🔄 Regenerovat', callback_data: `regenerate:${post.id}` },
        { text: '⏭️ Přeskočit', callback_data: `skip:${post.id}` },
      ]],
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Telegram send failed' }, { status: 500 })
  }
}
