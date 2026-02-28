import Anthropic from '@anthropic-ai/sdk'
import { ViralIdea } from './types'
import { getWeekNumber } from './schedule'
import { getSetting } from './settings'

const BRAND_CONTEXT = `
L9 AI Studios – AI agentura, zakladatel Lukáš (Praha).
Služby: Done-for-you AI automatizace pro malé firmy.
  • AI asistenti / chatboti pro barbershopy, salóny, restaurace
  • Webové stránky postavené s Claude Code (CC)
  • Custom AI nástroje a automatizace
Ceny: 5 000 Kč setup + 1 000 Kč/měsíc
Cílovka: Čeští podnikatelé – barbershopy, salóny, lokální živnostníci
Kanály: TikTok @l9_ai_studios, Instagram @l9_ai_studios
Tone: Zakladatel-founder vibe, autentický, ukazuje výsledky a zákulisí, tech ale lidsky
`.trim()

const TOPIC_POOL = [
  'POV: Postavil jsem AI asistenta pro barbershop za 2 hodiny s Claude Code',
  'Věci, které jsem tento týden zautomatizoval – klient ušetřil 5 hodin',
  'Jak postavím celý web za 30 minut s Claude Code (live ukázka)',
  'Tento AI chatbot přijímá rezervace 24/7 – postavil jsem ho za 5 000 Kč',
  'Den ze života: Czech AI founder buduje automatizace pro malé firmy',
  'Požádal jsem Claude, aby mi postavil kompletní byznys systém – výsledek?',
  'Proč každý malý podnik potřebuje AI asistenta v roce 2025',
  'Zákulisí: Nasazuju AI pro lokální barbershop v Praze',
  'Kdybych začínal AI agenturu znovu, udělal bych tohle jinak',
  'Co se stane, když dáte Claude Code kompletní brief webu',
  'Reakce klientů, když vidí svého AI asistenta poprvé',
  'Nejbizarnější věc, kterou umí AI asistenti pro barbershopy',
]

function getTodayTopic(weekNumber: number): string {
  const idx = (weekNumber + new Date().getDay()) % TOPIC_POOL.length
  return TOPIC_POOL[idx]
}

export async function generateViralIdea(topicHint?: string): Promise<ViralIdea> {
  const apiKey = getSetting('anthropic_api_key') || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const client = new Anthropic({ apiKey })
  const weekNumber = getWeekNumber()
  const suggestedTopic = topicHint || getTodayTopic(weekNumber)

  const prompt = `Jsi expert na virální TikTok / Instagram Reels content pro ${BRAND_CONTEXT}

Vygeneruj JEDEN virální video nápad pro dnešní den. Video musí být autentické, ukázat reálnou hodnotu a zastavit scroll.

Téma k inspiration: "${suggestedTopic}"`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    tools: [{
      name: 'create_viral_idea',
      description: 'Create a structured viral TikTok/Reels video idea',
      input_schema: {
        type: 'object' as const,
        properties: {
          title:             { type: 'string', description: 'Poutavý název videa, max 60 znaků' },
          hook:              { type: 'string', description: 'První 3 vteřiny – mluvená věta, max 12 slov' },
          script:            { type: 'string', description: 'Celý mluvený scénář, přirozená čeština, max 60 sekund' },
          visual_notes:      { type: 'string', description: '4-5 odrážek: co zobrazit, text overlaye, přechody, záběry' },
          hashtags:          { type: 'array', items: { type: 'string' }, description: '10 hashtagů, mix CZ+EN' },
          music_suggestion:  { type: 'string', description: 'Typ hudby / vibe – 1 věta' },
          cta:               { type: 'string', description: 'Výzva k akci na konci videa' },
          duration_seconds:  { type: 'number', description: 'Délka videa v sekundách' },
          platform:          { type: 'string', enum: ['tiktok', 'instagram', 'both'] },
          estimated_reach:   { type: 'string', description: 'Odhadovaný dosah, např. 10k–50k' },
        },
        required: ['title', 'hook', 'script', 'visual_notes', 'hashtags', 'music_suggestion', 'cta', 'duration_seconds', 'platform', 'estimated_reach'],
      },
    }],
    tool_choice: { type: 'tool', name: 'create_viral_idea' },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = message.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool_use block in response')
  const data = toolUse.input as Omit<ViralIdea, 'id' | 'generated_at' | 'status' | 'topic_hint'>

  return {
    id: `viral_${Date.now()}`,
    generated_at: new Date().toISOString(),
    status: 'new',
    topic_hint: suggestedTopic,
    ...data,
  } as ViralIdea
}
