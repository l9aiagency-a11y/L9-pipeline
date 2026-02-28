import { NextRequest, NextResponse } from 'next/server'
import { Post } from '@/lib/types'
import { sendWhatsAppPost } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const post: Post = await req.json()
    await sendWhatsAppPost(post)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'WhatsApp send failed', detail: (e as Error).message }, { status: 500 })
  }
}
