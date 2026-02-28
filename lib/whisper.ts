import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

export async function generateSubtitles(audioPath: string, postId: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'srt',
    language: 'cs',
  })

  const dir = '/tmp/l9-subtitles'
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filePath = path.join(dir, `${postId}.srt`)
  fs.writeFileSync(filePath, transcription as unknown as string)

  return filePath
}
