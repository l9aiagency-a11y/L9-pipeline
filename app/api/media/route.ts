import { NextRequest, NextResponse } from 'next/server'
import { getAllMedia, saveMediaItem, deleteMediaItem } from '@/lib/store'
import { MediaItem } from '@/lib/types'

export async function GET() {
  return NextResponse.json(getAllMedia())
}

// Accepts JSON with a MediaItem (blob URL already uploaded client-side)
export async function POST(req: NextRequest) {
  try {
    const item = (await req.json()) as MediaItem
    if (!item.id || !item.url) {
      return NextResponse.json({ error: 'Missing id or url' }, { status: 400 })
    }
    saveMediaItem(item)
    return NextResponse.json(item)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  deleteMediaItem(id)
  return NextResponse.json({ ok: true })
}
