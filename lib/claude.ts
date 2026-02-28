import Anthropic from '@anthropic-ai/sdk'
import { Post, PostType } from './types'
import { WEEKLY_SCHEDULE, getWeekNumber } from './schedule'

const client = new Anthropic()

const BRAND_CONTEXT = `L9 AI Studios Brand Context:
- Company: L9 AI Studios
- Founder: Lukáš, Prague
- Service: Done-for-you AI assistants for barbershops
- Price: 5,000 CZK setup + 1,000 CZK/month
- Key benefit: Saves 3-5 hours/week, never misses a booking, responds to Instagram DMs 24/7
- Target client: Barbershop owners in Czech Republic with active Instagram
- Website: l9studios.ai
- Instagram: @l9_ai_studios
- Contact: Telegram or Instagram DM`

const SYSTEM_PROMPT = `You are the content strategist for L9 AI Studios — a Czech AI agency that builds done-for-you AI assistants for barbershops in Prague and across Czech Republic.

You write Instagram content that:
- Speaks directly to Czech barbershop owners and local business owners
- Demonstrates AI expertise without being technical or nerdy
- Builds trust and credibility before a sales conversation
- Sounds like a real founder, not a marketing department

Brand voice: Confident, direct, occasional humor, always grounded. Like a smart friend who happens to know everything about AI.
Tagline energy: "My řešíme AI. Vy řešíte byznys."

engagement_score is always an integer from 1 to 10.

Always return valid JSON only. No explanation, no markdown, no preamble.`

const JSON_SCHEMA = `Return JSON:
{
  "ig_caption": "Full Czech Instagram caption 80-150 words, hashtags at the end",
  "hashtags": ["#tag1"],
  "voiceover_script": "30-40 second clean spoken Czech text. No emoji, no hashtags. Natural speech rhythm.",
  "video_brief": "Voiceover: ~Xs\\nZáběr 1: [prop/location], [exact action], [duration]s\\nZáběr 2: ...\\nZáběr 3: ...\\nZáběr 4: ...\\nZáběr 5: ...\\nTotal must match voiceover length.",
  "engagement_score": 7,
  "engagement_reason": "Jeden důvod proč toto skóre v češtině",
  "best_time": "...",
  "cta": "..."
}
ig_caption: 80-150 words. Hook in first line (no hashtags in body). Hashtags only at the very end. CTA before hashtags. Czech casual.
voiceover_script: Exact words Lukáš speaks. Natural spoken Czech, 1st person. No emoji, no hashtags. Optimized for speaking aloud, not reading. 30-40 seconds at 130 words/min Czech pace.
hashtags: 5 Czech barbershop + 5 Czech business + 5 AI/tech + 5 broad reach = 20 total.
video_brief: Calculate voiceover reading time (130 words/minute Czech). State it on first line: "Voiceover: ~32s → 5 záběrů po 7s". Then list exactly that many shots. Each shot: prop/location, exact action, duration in seconds. Czech. Props: laptop, coffee mug, phone showing Instagram DMs, Prague street/café background, hands on keyboard, whiteboard/notebook. Achievable alone with iPhone.
engagement_score: must be integer between 1 and 10 only, never higher.
engagement_reason: 1 sentence Czech explanation of the score.`

function buildPrompt(type: PostType, weekNumber: number, captionWords?: number): string {
  const captionRule = captionWords
    ? `ig_caption: EXACTLY ${captionWords - 5}–${captionWords + 5} words (strict!). Hook in first line (no hashtags in body). Hashtags only at end. CTA before hashtags.`
    : `ig_caption: 80-150 words. Hook in first line (no hashtags in body). Hashtags only at end. CTA before hashtags.`

  const timingNote = captionWords
    ? `Calculate voiceover reading time (130 words/minute Czech). voiceover_script must be ${captionWords - 5}–${captionWords + 5} words. State timing on first line of video_brief: "Voiceover: ~${Math.round(captionWords / 2.17)}s → X záběrů po Ys".`
    : `Calculate voiceover reading time (130 words/minute Czech). State timing on first line of video_brief: "Voiceover: ~Xs → X záběrů po Ys".`

  const schema = JSON_SCHEMA.replace(
    /ig_caption: [\d–-]+ words\. Hook in first line \(no hashtags in body\)\. Hashtags only at end\. CTA before hashtags\./,
    captionRule
  )
  const base = `${BRAND_CONTEXT}\n\n${schema}\n\n${timingNote}`

  const prompts: Record<PostType, string> = {
    educational: `Write an educational Instagram post for L9 AI Studios.\nDay: Monday\nGoal: Build authority. Teach something genuinely useful about AI for barbershops.\nFormat: List or "did you know" style. Max 5 points if list.\nTone: Expert but accessible. No jargon.\nLanguage: Czech casual\n\n${base}\nbest_time: "Monday 18:00"`,

    social_proof: `Write a social proof Instagram post for L9 AI Studios.\nDay: Tuesday\nGoal: Build trust via results. Show what AI does for a real barbershop.\nFormat: Mini case study or result snapshot. Can be hypothetical but realistic.\nTone: Matter-of-fact, let results speak.\nLanguage: Czech casual\n\n${base}\nbest_time: "Tuesday 18:00"\nRules: Lead with the result (time saved, bookings increased, DMs answered). Don't name specific client unless real. Keep it believable.`,

    behind_the_scenes: `Write a behind-the-scenes Instagram post for L9 AI Studios.\nDay: Wednesday\nGoal: Humanize the brand. Show Lukáš and the work behind the AI.\nFormat: Personal story or "day in the life" snippet.\nTone: Authentic, slightly personal, proud of the craft.\nLanguage: Czech casual — first person (já/my)\n\n${base}\nbest_time: "Wednesday 12:00"\nRules: Feel real. Could be about: building a new feature, a client conversation, a problem solved, a late night coding session.`,

    problem_solution: `Write a problem/solution Instagram post for L9 AI Studios.\nDay: Thursday\nGoal: Hit a pain point that barbershop owners feel. Then offer the solution.\nFormat: Problem first (1-2 sentences) → agitate → solution reveal.\nTone: Empathetic, then confident.\nLanguage: Czech casual\n\n${base}\nbest_time: "Thursday 18:00"\nPain points to rotate: missed bookings from Instagram DMs after hours, time wasted copy-pasting same answers to DMs, no-shows with no reminder system, competing barbershops that respond faster, weekends when owner is busy cutting but DMs pile up.`,

    promotional: `Write a direct promotional Instagram post for L9 AI Studios.\nDay: Friday\nGoal: Drive direct action — DM, book a call, try the free trial.\nFormat: Clear offer + clear CTA. No fluff.\nTone: Confident, direct, slight urgency without being pushy.\nLanguage: Czech casual\n\n${base}\nbest_time: "Friday 17:00"\nCurrent offer: Free 14-day trial, no setup fee for first clients.\nRules: Lead with the offer or result. CTA must be specific: "Napiš mi DM", "Klikni na odkaz v biu", "Odpověz na tento post".`,

    inspirational: `Write an inspirational Instagram post for L9 AI Studios.\nDay: Saturday\nGoal: Broad reach, shares, saves. Appeal beyond just barbershop owners.\nFormat: Short punchy thought. 1-3 paragraphs max.\nTone: Thoughtful, slightly poetic but grounded. Not self-help guru.\nLanguage: Czech casual\n\n${base}\nbest_time: "Saturday 10:00"\nRules: Connect barbershop craft to a bigger idea — tradition meets technology, pride in your work, building something that lasts.`,

    tips_tricks: `Write a tips & tricks Instagram post for L9 AI Studios.\nDay: Sunday\nGoal: Maximum saves and shares. Pure value, no hard sell.\nFormat: Numbered list of 3-5 actionable tips.\nTone: Helpful expert. Give away the good stuff.\nLanguage: Czech casual\n\n${base}\nbest_time: "Sunday 10:00"\nTopic this week (week ${weekNumber}): ${
      weekNumber % 4 === 1 ? 'Instagram tipy pro barbershopy'
      : weekNumber % 4 === 2 ? 'Jak získat více 5hvězdičkových recenzí'
      : weekNumber % 4 === 3 ? 'Psychologie cen pro barbershopy'
      : 'Jak přeměnit DM zprávy na rezervace'
    }`,
  }

  return prompts[type]
}

const POST_TOOL = {
  name: 'create_post',
  description: 'Create a structured Instagram video post with all required fields',
  input_schema: {
    type: 'object' as const,
    properties: {
      ig_caption:        { type: 'string', description: 'Instagram caption, 80-150 words, Czech casual. Hook first line, CTA at end.' },
      hashtags:          { type: 'array', items: { type: 'string' }, description: '20 hashtags total' },
      voiceover_script:  { type: 'string', description: 'Exact spoken words for Lukáš. Natural Czech, 1st person. No emoji, no hashtags. 30-40 seconds at 130 words/min.' },
      video_brief:       { type: 'string', description: 'First line: "Voiceover: ~Xs → N záběrů po Ys". Then N shots matching that duration. Each shot: prop/location, exact action, duration in seconds. Czech.' },
      engagement_score:  { type: 'number', description: 'Integer from 1 to 10 only, never higher' },
      engagement_reason: { type: 'string', description: '1 sentence why this score, Czech' },
      best_time:         { type: 'string', description: 'Best posting time, e.g. "Monday 18:00"' },
      cta:               { type: 'string', description: 'Call-to-action text' },
    },
    required: ['ig_caption', 'hashtags', 'voiceover_script', 'video_brief', 'engagement_score', 'engagement_reason', 'best_time', 'cta'],
  },
}

async function callClaude(type: PostType, weekNumber: number, captionWords?: number) {
  const wordRange = captionWords
    ? `exactly ${captionWords - 5}–${captionWords + 5} words`
    : '80–150 words'
  const tool = {
    ...POST_TOOL,
    input_schema: {
      ...POST_TOOL.input_schema,
      properties: {
        ...POST_TOOL.input_schema.properties,
        ig_caption: { type: 'string', description: `Instagram caption, ${wordRange}, Czech casual. Hook in first line (no hashtags in body). Hashtags only at end. CTA before hashtags.` },
        voiceover_script: { type: 'string', description: `Exact spoken words for Lukáš. Natural Czech, 1st person. No emoji, no hashtags. ${wordRange}. 30-40 seconds at 130 words/min.` },
      },
    },
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'create_post' },
    messages: [{ role: 'user', content: buildPrompt(type, weekNumber, captionWords) }],
  })
  const toolUse = message.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool_use block in response')
  return toolUse.input as { ig_caption: string; hashtags: string[]; voiceover_script: string; video_brief: string; engagement_score: number; engagement_reason: string; best_time: string; cta: string }
}

export async function generatePost(dayOfWeek: number, weekNumber: number, captionWords?: number): Promise<Post> {
  const schedule = WEEKLY_SCHEDULE[dayOfWeek]
  const data = await callClaude(schedule.type, weekNumber, captionWords)
  return {
    id: crypto.randomUUID(),
    post_type: schedule.type,
    day_of_week: dayOfWeek,
    week_number: weekNumber,
    ig_caption: data.ig_caption,
    hashtags: data.hashtags,
    voiceover_script: data.voiceover_script,
    video_brief: data.video_brief,
    engagement_score: data.engagement_score,
    engagement_reason: data.engagement_reason,
    best_time: data.best_time,
    cta: data.cta,
    status: 'pending_review',
    generated_at: new Date().toISOString(),
    regeneration_count: 0,
  }
}

export async function regeneratePost(post: Post): Promise<Post> {
  const data = await callClaude(post.post_type, post.week_number)
  return {
    ...post,
    ig_caption: data.ig_caption,
    hashtags: data.hashtags,
    voiceover_script: data.voiceover_script,
    video_brief: data.video_brief,
    engagement_score: data.engagement_score,
    engagement_reason: data.engagement_reason,
    best_time: data.best_time,
    cta: data.cta,
    status: 'pending_review',
    generated_at: new Date().toISOString(),
    regeneration_count: post.regeneration_count + 1,
  }
}

export async function generateThreePosts(dayOfWeek: number, weekNumber: number): Promise<Post[]> {
  // Sequential to avoid Opus rate limits. Different word targets → ~35s / ~50s / ~65s read time
  // Czech speech ~130 words/min = ~2.17 words/sec
  const a = await generatePost(dayOfWeek, weekNumber, 76)   // ~35s
  const b = await generatePost(dayOfWeek, weekNumber, 108)  // ~50s
  const c = await generatePost(dayOfWeek, weekNumber, 141)  // ~65s
  return [a, b, c]
}
