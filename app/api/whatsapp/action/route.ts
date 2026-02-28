import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost, savePost, getAllPosts } from '@/lib/store'
import { regeneratePost } from '@/lib/claude'
import { sendWhatsAppPost } from '@/lib/whatsapp'

// GET /api/whatsapp/action?action=approve&id=xxx
// Tapped from link in WhatsApp message — returns a simple HTML confirmation page
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')
  const postId = req.nextUrl.searchParams.get('id')

  if (!action || !postId) {
    return html('❌ Chybí parametry.', 400)
  }

  try {
    if (action === 'approve') {
      const post = getPost(postId)
      if (!post) return html('❌ Post nenalezen.', 404)
      updatePost(postId, { status: 'approved', approved_at: new Date().toISOString() })
      // Auto-skip other pending variants for the same day
      getAllPosts()
        .filter(p =>
          p.id !== postId &&
          p.day_of_week === post.day_of_week &&
          p.week_number === post.week_number &&
          p.status === 'pending_review'
        )
        .forEach(p => updatePost(p.id, { status: 'failed' }))
      return html('✅ Post schválen! Zveřejní se v 7:30.')

    } else if (action === 'skip') {
      updatePost(postId, { status: 'failed' })
      return html('⏭️ Post přeskočen.')

    } else if (action === 'regenerate') {
      const existing = getPost(postId)
      if (!existing) return html('❌ Post nenalezen.', 404)
      const newPost = await regeneratePost(existing)
      savePost(newPost)
      // Send new post to WhatsApp
      await sendWhatsAppPost(newPost)
      return html('🔄 Regenerace dokončena! Nový post dorazí na WhatsApp.')

    } else {
      return html('❌ Neznámá akce.', 400)
    }
  } catch (e) {
    console.error(e)
    return html(`❌ Chyba: ${(e as Error).message}`, 500)
  }
}

function html(message: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>L9 AI Studios</title>
    <style>body{font-family:system-ui,sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#0E0E0E;border-radius:16px;padding:32px 24px;text-align:center;max-width:320px}
    h2{margin:0 0 8px;font-size:2rem}p{margin:0;color:#9ca3af;font-size:1rem}</style>
    </head><body><div class="card"><h2>${message.split(' ').slice(0,1).join('')}</h2>
    <p>${message.split(' ').slice(1).join(' ')}</p></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
