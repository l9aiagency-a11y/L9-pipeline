import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost } from '@/lib/store'
import { generateVoiceover } from '@/lib/elevenlabs'
import { renderVideo } from '@/lib/creatomate'
import { uploadFile } from '@/lib/storage'
import { getTempPath } from '@/lib/paths'
import fs from 'fs'

export const maxDuration = 180

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json()
    if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

    const post = getPost(post_id)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // 1. Need at least one video clip uploaded
    const videoClipUrl = post.video_clips?.[0]
    if (!videoClipUrl) {
      return NextResponse.json(
        { error: 'No video clips found. Upload videos first.' },
        { status: 400 }
      )
    }

    // 2. Generate voiceover if not already present, then upload to Blob for public URL
    const audioPath = getTempPath('l9-audio', `${post_id}.mp3`)
    if (!fs.existsSync(audioPath)) {
      await generateVoiceover(post.voiceover_script, post_id)
    }
    const audioUrl = await uploadFile(audioPath)

    // 3. Kick off Creatomate render
    const { renderId } = await renderVideo({
      audio_url: audioUrl,
      video_clip_url: videoClipUrl,
    })

    // 4. Update post with render_id + status
    updatePost(post_id, {
      render_id: renderId,
      status: 'rendering',
      render_started_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, render_id: renderId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Render failed', detail: (e as Error).message }, { status: 500 })
  }
}
