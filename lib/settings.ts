import { AppSettings } from './types'

declare global {
  // eslint-disable-next-line no-var
  var __settings: Partial<AppSettings> | undefined
}

const store: Partial<AppSettings> = globalThis.__settings ?? (globalThis.__settings = {})

const ENV_MAP: Record<keyof AppSettings, string> = {
  anthropic_api_key: 'ANTHROPIC_API_KEY',
  telegram_bot_token: 'TELEGRAM_BOT_TOKEN',
  telegram_chat_id: 'TELEGRAM_CHAT_ID',
  telegram_webhook_secret: 'TELEGRAM_WEBHOOK_SECRET',
  elevenlabs_api_key: 'ELEVENLABS_API_KEY',
  elevenlabs_voice_id: 'ELEVENLABS_VOICE_ID',
  instagram_access_token: 'INSTAGRAM_ACCESS_TOKEN',
  instagram_business_account_id: 'INSTAGRAM_BUSINESS_ACCOUNT_ID',
  meta_app_id: 'META_APP_ID',
  meta_app_secret: 'META_APP_SECRET',
  cron_secret: 'CRON_SECRET',
}

export function getSetting(key: keyof AppSettings): string {
  return store[key] ?? process.env[ENV_MAP[key]] ?? ''
}

export function getAllSettings(): Partial<AppSettings> {
  const result: Partial<AppSettings> = {}
  for (const key of Object.keys(ENV_MAP) as (keyof AppSettings)[]) {
    result[key] = getSetting(key)
  }
  return result
}

export function updateSettings(updates: Partial<AppSettings>): void {
  Object.assign(store, updates)
}
