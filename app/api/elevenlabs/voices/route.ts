import { NextResponse } from 'next/server'
import { getVoices } from '@/lib/elevenlabs'

export async function GET() {
  try {
    const data = await getVoices()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
