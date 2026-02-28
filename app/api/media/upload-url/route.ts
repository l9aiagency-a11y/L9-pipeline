import { NextRequest, NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'

export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          allowOverwrite: true,
        }
      },
      onUploadCompleted: async () => {
        // No-op — the client handles saving the URL to the post
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
