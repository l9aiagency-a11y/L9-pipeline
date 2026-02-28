import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost } from '@/lib/store'
import { uploadBuffer } from '@/lib/storage'

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const urls: string[] = [...(post.video_clips ?? [])]

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop() ?? 'mp4'
      const filename = `${id}_clip${urls.length}.${ext}`
      const url = await uploadBuffer(buffer, filename, file.type, 'l9-videos')
      urls.push(url)
    }

    const updated = updatePost(id, {
      video_clips: urls,
      video_uploaded_at: new Date().toISOString(),
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json(
      { error: 'Upload failed', detail: (e as Error).message },
      { status: 500 }
    )
  }
}
