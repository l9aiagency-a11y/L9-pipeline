import { NextRequest, NextResponse } from 'next/server'
import { updatePost } from '@/lib/store'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const updates = await req.json()
  const updated = updatePost(params.id, updates)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
