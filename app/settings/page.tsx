'use client'
import { useEffect, useState } from 'react'

interface Field {
  key: string
  label: string
  placeholder: string
  hint?: string
  type?: 'text' | 'password'
}

const SECTIONS: { title: string; icon: string; fields: Field[] }[] = [
  {
    title: 'Claude / Anthropic',
    icon: '🤖',
    fields: [
      { key: 'anthropic_api_key', label: 'API Key', placeholder: 'sk-ant-api03-…', type: 'password', hint: 'console.anthropic.com' },
    ],
  },
  {
    title: 'ElevenLabs (Hlas)',
    icon: '🎙️',
    fields: [
      { key: 'elevenlabs_api_key', label: 'API Key', placeholder: 'el-…', type: 'password', hint: 'elevenlabs.io/app/speech-synthesis' },
      { key: 'elevenlabs_voice_id', label: 'Voice ID', placeholder: 'pNInz6obpgDQGcFmaJgB', hint: 'Výchozí: Adam. Najdeš v ElevenLabs → Voices.' },
    ],
  },
  {
    title: 'Telegram',
    icon: '📨',
    fields: [
      { key: 'telegram_bot_token', label: 'Bot Token', placeholder: '123456:AAFlm3k…', type: 'password', hint: 'Získej od @BotFather' },
      { key: 'telegram_chat_id', label: 'Chat ID', placeholder: '-100123456789', hint: 'curl https://api.telegram.org/bot<TOKEN>/getUpdates' },
      { key: 'telegram_webhook_secret', label: 'Webhook Secret', placeholder: 'náhodný-řetězec', type: 'password' },
    ],
  },
  {
    title: 'Meta / Instagram',
    icon: '📸',
    fields: [
      { key: 'meta_app_id', label: 'App ID', placeholder: '1234567890' },
      { key: 'meta_app_secret', label: 'App Secret', placeholder: 'abc123…', type: 'password' },
      { key: 'instagram_access_token', label: 'Access Token', placeholder: 'EAA…', type: 'password', hint: 'Získej přes Meta Graph API Explorer' },
      { key: 'instagram_business_account_id', label: 'Business Account ID', placeholder: '17841400…' },
    ],
  },
  {
    title: 'Bezpečnost',
    icon: '🔐',
    fields: [
      { key: 'cron_secret', label: 'Cron Secret', placeholder: 'náhodný-řetězec', type: 'password', hint: 'Nastavte stejnou hodnotu v Vercel Env Vars' },
    ],
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setValues(data)
      setLoading(false)
    })
  }, [])

  const save = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Načítám…</div>
  )

  return (
    <div className="min-h-screen bg-[#050505]">
      <main className="mx-auto max-w-2xl px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">⚙️ Nastavení</h1>
            <p className="text-sm text-gray-500">API klíče a integrace. Uložené v paměti serveru (přidej do .env.local pro trvalost).</p>
          </div>
          <button
            onClick={save}
            className="bg-[#0077FF] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#0066DD] transition-colors"
          >
            {saved ? '✅ Uloženo' : 'Uložit'}
          </button>
        </div>

        {SECTIONS.map(section => (
          <div key={section.title} className="rounded-xl border border-[#1a1a1a] bg-[#0E0E0E] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center gap-2">
              <span>{section.icon}</span>
              <span className="text-sm font-semibold text-white">{section.title}</span>
            </div>
            <div className="p-4 space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 border border-[#2a2a2a] placeholder-gray-700 focus:outline-none focus:border-[#0077FF] font-mono"
                    autoComplete="off"
                  />
                  {field.hint && (
                    <p className="text-xs text-gray-600 mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-[#1a1a1a] bg-[#0E0E0E] p-4">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Pro trvalé uložení</div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Hodnoty uložené zde zůstávají jen do restartu serveru. Pro trvalé uložení přidej tyto proměnné do <code className="text-[#4DA6FF]">.env.local</code> nebo Vercel Environment Variables.
          </p>
        </div>
      </main>
    </div>
  )
}
