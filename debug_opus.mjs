import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are the content strategist for L9 AI Studios. Always return valid JSON only. No explanation, no markdown, no preamble.`
const PROMPT = `Write a behind-the-scenes Instagram post for L9 AI Studios. Day: Wednesday. Language: Czech casual.
Return JSON: {"caption":"...","hashtags":["..."],"canva_prompt":"...","image_direction":"...","best_time":"...","cta":"..."}`

const msg = await client.messages.create({
  model: 'claude-opus-4-6', max_tokens: 2048, system: SYSTEM,
  messages: [{ role: 'user', content: PROMPT }]
})
const raw = msg.content[0].text
const start = raw.indexOf('{'), end = raw.lastIndexOf('}')
const jsonStr = raw.slice(start, end + 1)

try {
  JSON.parse(jsonStr)
  console.log('PARSE OK ✓')
} catch(e) {
  console.log('PARSE ERROR:', e.message)
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] ?? '0')
  console.log('CONTEXT AROUND ERROR:')
  console.log(JSON.stringify(jsonStr.slice(Math.max(0, pos-80), pos+80)))
  console.log('\nFULL RAW (first 500):')
  console.log(JSON.stringify(raw.slice(0, 500)))
}
