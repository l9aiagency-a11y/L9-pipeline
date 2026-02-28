import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

// Upload a local file to Vercel Blob and return its public URL.
// Requires BLOB_READ_WRITE_TOKEN to be set (from Vercel dashboard → Storage → Blob).
export async function uploadFile(filePath: string, folder = 'l9'): Promise<string> {
  const filename = path.basename(filePath)
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const contentType =
    ext === '.mp3' ? 'audio/mpeg' :
    ext === '.mp4' ? 'video/mp4' :
    ext === '.srt' ? 'text/plain' :
    'application/octet-stream'

  const blob = await put(`${folder}/${filename}`, buffer, {
    access: 'public',
    contentType,
    allowOverwrite: true,
  })

  return blob.url
}

/** Upload a Buffer directly to Vercel Blob (for FormData uploads without local file). */
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder = 'l9'
): Promise<string> {
  const blob = await put(`${folder}/${filename}`, buffer, {
    access: 'public',
    contentType,
    allowOverwrite: true,
  })
  return blob.url
}
