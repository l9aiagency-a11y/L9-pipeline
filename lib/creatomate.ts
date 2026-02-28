import fs from 'fs'
import { uploadFile } from './storage'

const BASE = 'https://api.creatomate.com/v1'

function apiKey(): string {
  const k = process.env.CREATOMATE_API_KEY
  if (!k) throw new Error('CREATOMATE_API_KEY not set')
  return k
}

export async function renderVideo(params: {
  postId: string
  videoFiles: string[]
  audioPath: string
  subtitlesPath: string
}): Promise<{ renderId: string }> {
  const { videoFiles, audioPath, subtitlesPath } = params

  const srtContent = fs.readFileSync(subtitlesPath, 'utf8')
  const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/creatomate/webhook`

  // Creatomate requires public HTTPS URLs — upload local files to Vercel Blob
  const audioUrl = await uploadFile(audioPath)
  const videoUrls = await Promise.all(
    videoFiles.map(f => f.startsWith('http') ? Promise.resolve(f) : uploadFile(f))
  )

  // Build video elements — one per clip, all looped to match audio duration
  const videoElements = videoUrls.map((url, i) => ({
    type: 'video',
    track: 1,
    loop: true,
    dynamic: true,
    source: url,
    ...(videoUrls.length > 1 ? { time: `${i} * (duration / ${videoUrls.length})` } : {}),
  }))

  const source = {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    elements: [
      ...videoElements,
      {
        type: 'audio',
        track: 2,
        source: audioUrl,
      },
      {
        type: 'text',
        track: 3,
        // Inline SRT as plain-text source — Creatomate auto-parses SRT for text elements
        // when used with transcript timing
        text: srtContent,
        font_family: 'Montserrat',
        font_weight: '700',
        font_size: '8 vmin',
        color: '#FFFFFF',
        background_color: '#0077FF',
        x_padding: '4 vmin',
        y_padding: '2 vmin',
        border_radius: '4 vmin',
        x_alignment: '50%',
        y: '75%',
        width: '80%',
        height: '15%',
        x: '50%',
      },
    ],
  }

  const res = await fetch(`${BASE}/renders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source, webhook_url: webhookUrl }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Creatomate render failed ${res.status}: ${err}`)
  }

  const data = await res.json() as Array<{ id: string }>
  return { renderId: data[0].id }
}

export async function getRenderStatus(renderId: string): Promise<{
  status: string
  url?: string
  cover_url?: string
}> {
  const res = await fetch(`${BASE}/renders/${renderId}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Creatomate status check failed ${res.status}: ${err}`)
  }

  const data = await res.json() as { status: string; url?: string; snapshot_url?: string }
  return {
    status: data.status,
    url: data.url,
    cover_url: data.snapshot_url,
  }
}
