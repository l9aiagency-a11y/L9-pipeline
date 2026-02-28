import { NextRequest, NextResponse } from 'next/server'
import { getAllMedia, saveMediaItem, deleteMediaItem } from '@/lib/store'
import { MediaItem } from '@/lib/types'

export async function GET() {
  return NextResponse.json(getAllMedia())
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    const item: MediaItem = {
      id: `media_${Date.now()}`,
      filename: `${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      uploaded_at: new Date().toISOString(),
      url: dataUrl,
      tags: [],
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
