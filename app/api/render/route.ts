import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost } from '@/lib/store'
import { generateVoiceover } from '@/lib/elevenlabs'
import { generateSubtitles } from '@/lib/whisper'
import { renderVideo } from '@/lib/creatomate'
import { getTempPath, getTempDir } from '@/lib/paths'
import fs from 'fs'
import path from 'path'

export const maxDuration = 180

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json()
    if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

    const post = getPost(post_id)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // 1. Generate voiceover if not already present
    const audioPath = getTempPath('l9-audio', `${post_id}.mp3`)
    if (!fs.existsSync(audioPath)) {
      await generateVoiceover(post.voiceover_script, post_id)
    }

    // 2. Generate subtitles from audio
    const subtitlesPath = getTempPath('l9-subtitles', `${post_id}.srt`)
    if (!fs.existsSync(subtitlesPath)) {
      await generateSubtitles(audioPath, post_id)
    }

    // 3. Collect video clips — prefer Blob URLs from post, fall back to local files
    let videoFiles: string[] = [...(post.video_clips ?? [])]

    if (videoFiles.length === 0) {
      const videoDir = getTempDir('l9-videos', post_id)
      if (fs.existsSync(videoDir)) {
        videoFiles = fs.readdirSync(videoDir)
          .filter(f => f.endsWith('.mp4') || f.endsWith('.mov'))
          .map(f => path.join(videoDir, f))
          .sort()
      }
    }

    if (videoFiles.length === 0) {
      return NextResponse.json(
        { error: 'No video clips found. Upload videos first.' },
        { status: 400 }
      )
    }

    // 4. Kick off Creatomate render
    const { renderId } = await renderVideo({ postId: post_id, videoFiles, audioPath, subtitlesPath })

    // 5. Update post with render_id + status
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
