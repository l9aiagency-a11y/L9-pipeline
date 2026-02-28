'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, EyeOff, Save, Check } from 'lucide-react'

interface Field {
  key: string
  label: string
  placeholder: string
  hint?: string
  type?: 'text' | 'password'
}

const SECTIONS: { title: string; icon: string; description: string; fields: Field[] }[] = [
  {
    title: 'Claude / Anthropic',
    icon: '\uD83E\uDD16',
    description: 'API klic pro generovani obsahu',
    fields: [
      { key: 'anthropic_api_key', label: 'API Key', placeholder: 'sk-ant-api03-...', type: 'password', hint: 'console.anthropic.com' },
    ],
  },
  {
    title: 'ElevenLabs (Hlas)',
    icon: '\uD83C\uDF99\uFE0F',
    description: 'Text-to-speech pro voiceovery',
    fields: [
      { key: 'elevenlabs_api_key', label: 'API Key', placeholder: 'el-...', type: 'password', hint: 'elevenlabs.io/app/speech-synthesis' },
      { key: 'elevenlabs_voice_id', label: 'Voice ID', placeholder: 'pNInz6obpgDQGcFmaJgB', hint: 'Vychozi: Adam. Najdes v ElevenLabs \u2192 Voices.' },
    ],
  },
  {
    title: 'Telegram',
    icon: '\uD83D\uDCE8',
    description: 'Notifikace a schvalovani pres Telegram',
    fields: [
      { key: 'telegram_bot_token', label: 'Bot Token', placeholder: '123456:AAFlm3k...', type: 'password', hint: 'Ziskej od @BotFather' },
      { key: 'telegram_chat_id', label: 'Chat ID', placeholder: '-100123456789', hint: 'curl https://api.telegram.org/bot<TOKEN>/getUpdates' },
      { key: 'telegram_webhook_secret', label: 'Webhook Secret', placeholder: 'nahodny-retezec', type: 'password' },
    ],
  },
  {
    title: 'Meta / Instagram',
    icon: '\uD83D\uDCF8',
    description: 'Publikovani Reels na Instagram',
    fields: [
      { key: 'meta_app_id', label: 'App ID', placeholder: '1234567890' },
      { key: 'meta_app_secret', label: 'App Secret', placeholder: 'abc123...', type: 'password' },
      { key: 'instagram_access_token', label: 'Access Token', placeholder: 'EAA...', type: 'password', hint: 'Ziskej pres Meta Graph API Explorer' },
      { key: 'instagram_business_account_id', label: 'Business Account ID', placeholder: '17841400...' },
    ],
  },
  {
    title: 'Bezpecnost',
    icon: '\uD83D\uDD10',
    description: 'Cron joby a webhook overeni',
    fields: [
      { key: 'cron_secret', label: 'Cron Secret', placeholder: 'nahodny-retezec', type: 'password', hint: 'Nastavte stejnou hodnotu v Vercel Env Vars' },
    ],
  },
]

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors pr-10"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-8">

        {/* Header */}
        <div className="px-4 pt-6 md:px-6 md:pt-8">
          <h1 className="text-2xl font-semibold text-foreground">Nastaveni</h1>
          <p className="text-xs text-muted-foreground mt-1">API klice a integrace. Ulozene v pameti serveru (pridej do .env.local pro trvalost).</p>
        </div>

        {/* Sections */}
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-card rounded-2xl mx-4 md:mx-6 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              <div>
                <div className="text-sm font-medium text-foreground">{section.title}</div>
                <div className="text-xs text-muted-foreground">{section.description}</div>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{field.label}</label>
                  {field.type === 'password' ? (
                    <PasswordInput
                      value={values[field.key] ?? ''}
                      onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[field.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      autoComplete="off"
                    />
                  )}
                  {field.hint && (
                    <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Info card */}
        <div className="bg-card rounded-2xl mx-4 md:mx-6 p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Pro trvale ulozeni</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hodnoty ulozene zde zustavaji jen do restartu serveru. Pro trvale ulozeni pridej tyto promenne do <code className="text-primary">.env.local</code> nebo Vercel Environment Variables.
          </p>
        </div>
      </div>

      {/* Fixed save button (mobile) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:relative md:border-0 md:mx-auto md:max-w-2xl md:px-6 md:pb-8">
        <button
          onClick={save}
          className={`w-full rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Ulozeno
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Ulozit
            </>
          )}
        </button>
      </div>
    </div>
  )
}
