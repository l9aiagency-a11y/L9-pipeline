import { NextRequest, NextResponse } from 'next/server'
import { generateVoice } from '@/lib/elevenlabs'
import { updateViralIdea } from '@/lib/store'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { text, idea_id } = await req.json()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const audioBuffer = await generateVoice(text)

    // Return base64 audio to client; client stores as data URL or triggers download
    const base64 = audioBuffer.toString('base64')
    const dataUrl = `data:audio/mpeg;base64,${base64}`

    // Persist audio_url on the viral idea
    if (idea_id) {
      updateViralIdea(idea_id, { audio_url: dataUrl })
    }

    return NextResponse.json({ audio: dataUrl })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
