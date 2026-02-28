import { NextRequest, NextResponse } from 'next/server'
import { getViralIdea, updateViralIdea } from '@/lib/store'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = await req.json()
  const updated = updateViralIdea(params.id, updates)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idea = getViralIdea(params.id)
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(idea)
}
