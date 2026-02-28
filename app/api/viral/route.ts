import { NextRequest, NextResponse } from 'next/server'
import { generateViralIdea } from '@/lib/viral'
import { getAllViralIdeas, saveViralIdea } from '@/lib/store'

export const maxDuration = 60

export async function GET() {
  return NextResponse.json(getAllViralIdeas())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const idea = await generateViralIdea(body.topic_hint)
    saveViralIdea(idea)
    return NextResponse.json(idea)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
