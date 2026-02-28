import OpenAI from 'openai'
import fs from 'fs'
import { getTempPath } from './paths'

export async function generateSubtitles(audioPath: string, postId: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'srt',
    language: 'cs',
  })

  const filePath = getTempPath('l9-subtitles', `${postId}.srt`)
  fs.writeFileSync(filePath, transcription as unknown as string)

  return filePath
}
