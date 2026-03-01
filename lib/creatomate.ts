const BASE = 'https://api.creatomate.com/v1'

function apiKey(): string {
  const k = process.env.CREATOMATE_API_KEY
  if (!k) throw new Error('CREATOMATE_API_KEY not set')
  return k
}

export async function renderVideo(params: {
  audio_url: string
  video_clip_url: string
}): Promise<{ renderId: string }> {
  const { audio_url, video_clip_url } = params
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://l9-pipeline.vercel.app'}/api/creatomate/webhook`

  const source = {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    elements: [
      {
        type: 'video',
        id: 'background_video',
        source: video_clip_url,
        width: '100%',
        height: '100%',
        x: '50%',
        y: '50%',
        x_anchor: '50%',
        y_anchor: '50%',
        fit: 'cover',
        duration: 'auto',
      },
      {
        type: 'shape',
        shape: 'rectangle',
        width: '100%',
        height: '100%',
        x: '50%',
        y: '50%',
        x_anchor: '50%',
        y_anchor: '50%',
        fill_color: '#000000',
        fill_opacity: 0.35,
      },
      {
        type: 'audio',
        id: 'voiceover',
        source: audio_url,
        duration: 'auto',
      },
      {
        type: 'text',
        transcript_source: 'voiceover',
        transcript_effect: 'highlight',
        transcript_maximum_length: 3,
        width: '85%',
        height: 'auto',
        x: '50%',
        y: '62%',
        x_anchor: '50%',
        y_anchor: '50%',
        font_family: 'Montserrat',
        font_weight: '800',
        font_size: '72px',
        text_transform: 'uppercase',
        fill_color: '#FFFFFF',
        highlight_color: '#FFD700',
        text_align: 'center',
        line_height: '1.2',
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
