import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost, savePost, getAllPosts } from '@/lib/store'
import { regeneratePost } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const body = await req.json()
    const query = body.callback_query
    if (!query) return NextResponse.json({ ok: true })

    const [action, postId] = query.data.split(':')
    const token = process.env.TELEGRAM_BOT_TOKEN!
    const chatId = query.message.chat.id
    const messageId = query.message.message_id

    const editMessage = async (text: string) => {
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
      })
    }

    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: query.id }),
    })

    if (action === 'approve') {
      updatePost(postId, { status: 'approved', approved_at: new Date().toISOString() })
      const approved = getPost(postId)!
      // Auto-skip the other pending variants for the same day
      getAllPosts()
        .filter(p =>
          p.id !== postId &&
          p.day_of_week === approved.day_of_week &&
          p.week_number === approved.week_number &&
          p.status === 'pending_review'
        )
        .forEach(p => updatePost(p.id, { status: 'failed' }))
      await editMessage('✅ Vybráno! Post se zveřejní v 7:30.')
    } else if (action === 'skip') {
      updatePost(postId, { status: 'failed' })
      await editMessage('⏭️ Přeskočeno.')
    } else if (action === 'regenerate') {
      await editMessage('🔄 Regeneruji nový post...')
      const existing = getPost(postId)
      if (existing) {
        const newPost = await regeneratePost(existing)
        savePost(newPost)
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPost),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}
