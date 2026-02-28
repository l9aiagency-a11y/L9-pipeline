import fs from 'fs'
import path from 'path'
import { getSetting } from './settings'

const BASE = 'https://api.elevenlabs.io/v1'
// Default: "Adam" – clear, natural male voice
const DEFAULT_VOICE = 'pNInz6obpgDQGcFmaJgB'

function apiKey(): string {
  return process.env.ELEVENLABS_API_KEY || getSetting('elevenlabs_api_key') || ''
}

function voiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID || getSetting('elevenlabs_voice_id') || DEFAULT_VOICE
}

// ── Existing: used by /api/voice (returns raw Buffer for streaming) ──────────

export async function generateVoice(text: string): Promise<Buffer> {
  const key = apiKey()
  if (!key) throw new Error('ELEVENLABS_API_KEY not set')

  const res = await fetch(`${BASE}/text-to-speech/${voiceId()}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': key,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs: ${res.status} ${err}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

export async function listVoices(key: string) {
  const res = await fetch(`${BASE}/voices`, {
    headers: { 'xi-api-key': key },
  })
  if (!res.ok) throw new Error('Failed to fetch ElevenLabs voices')
  return res.json()
}

// ── New: generates voiceover, saves MP3 to /tmp/l9-audio/{post_id}.mp3 ──────

export async function generateVoiceover(text: string, post_id: string): Promise<string> {
  const key = apiKey()
  if (!key) throw new Error('ELEVENLABS_API_KEY not set')

  const res = await fetch(`${BASE}/text-to-speech/${voiceId()}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': key,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs: ${res.status} ${err}`)
  }

  const dir = '/tmp/l9-audio'
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filePath = path.join(dir, `${post_id}.mp3`)
  fs.writeFileSync(filePath, Buffer.from(await res.arrayBuffer()))

  return filePath
}

// ── New: returns available voices (uses env key directly) ────────────────────

export async function getVoices() {
  const key = apiKey()
  if (!key) throw new Error('ELEVENLABS_API_KEY not set')
  const res = await fetch(`${BASE}/voices`, {
    headers: { 'xi-api-key': key },
  })
  if (!res.ok) throw new Error(`ElevenLabs voices: ${res.status}`)
  return res.json()
}
