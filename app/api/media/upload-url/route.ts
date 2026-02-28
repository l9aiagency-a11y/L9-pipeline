import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/x-msvideo',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
        }
      },
      onUploadCompleted: async () => {
        // No-op — the client saves the blob URL to the store via /api/media POST
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
