import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, updateSettings } from '@/lib/settings'
import { AppSettings } from '@/lib/types'

export async function GET() {
  const settings = getAllSettings()
  // Mask secret values — only show whether they are set
  const masked: Record<string, string> = {}
  for (const [k, v] of Object.entries(settings)) {
    if (!v) { masked[k] = ''; continue }
    const SECRET_KEYS = ['api_key', 'secret', 'token', 'access_token']
    const isSecret = SECRET_KEYS.some(s => k.includes(s))
    masked[k] = isSecret ? '••••••••' + v.slice(-4) : v
  }
  return NextResponse.json(masked)
}

export async function POST(req: NextRequest) {
  const updates = await req.json() as Partial<AppSettings>
  // Filter out masked values (unchanged secrets)
  const cleaned: Partial<AppSettings> = {}
  for (const [k, v] of Object.entries(updates) as [keyof AppSettings, string][]) {
    if (v && !v.startsWith('••••')) cleaned[k] = v
  }
  updateSettings(cleaned)
  return NextResponse.json({ ok: true })
}
