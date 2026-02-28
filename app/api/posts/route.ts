import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, savePost } from '@/lib/store'

export async function GET() {
  return NextResponse.json(getAllPosts())
}

export async function POST(req: NextRequest) {
  const post = await req.json()
  savePost(post)
  return NextResponse.json(post)
}
