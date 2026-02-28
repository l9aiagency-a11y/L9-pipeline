import { getPostsByStatus } from '@/lib/db'
import type { PostType } from '@/lib/types'

const GRAPH = 'https://graph.facebook.com/v19.0'

function accessToken(): string {
  const t = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!t) throw new Error('INSTAGRAM_ACCESS_TOKEN not set')
  return t
}

interface PostInsights {
  reach: number
  likes: number
  saves: number
  comments: number
}

async function fetchInsights(instagramPostId: string): Promise<PostInsights> {
  const res = await fetch(
    `${GRAPH}/${instagramPostId}/insights?metric=reach,likes,saved,comments&access_token=${accessToken()}`
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instagram insights failed for ${instagramPostId} — ${res.status}: ${err}`)
  }
  const data = await res.json() as { data: Array<{ name: string; values: Array<{ value: number }> }> }

  const get = (name: string) =>
    data.data.find(d => d.name === name)?.values?.[0]?.value ?? 0

  return {
    reach:    get('reach'),
    likes:    get('likes'),
    saves:    get('saved'),
    comments: get('comments'),
  }
}

function recommendation(postType: string): string {
  switch (postType as PostType) {
    case 'educational':
      return 'Vzdělávací obsah funguje nejlépe. Příští týden více tipů a how-to.'
    case 'social_proof':
      return 'Social proof rezonuje. Přidej více výsledků klientů.'
    case 'behind_the_scenes':
      return 'BTS obsah baví lidi. Více zákulisí příští týden.'
    default:
      return 'Pokračuj v současné strategii.'
  }
}

export async function getWeeklyInsights(): Promise<{
  topPost: { id: string; reach: number; likes: number; saves: number; url: string }
  totalReach: number
  totalLikes: number
  totalSaves: number
  avgEngagement: number
  recommendation: string
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const allPosted = getPostsByStatus('posted') as Array<Record<string, unknown>>
  const recent = allPosted.filter(
    p => typeof p.posted_at === 'string' && p.posted_at >= sevenDaysAgo
  )

  if (recent.length === 0) {
    return {
      topPost: { id: '', reach: 0, likes: 0, saves: 0, url: '' },
      totalReach: 0,
      totalLikes: 0,
      totalSaves: 0,
      avgEngagement: 0,
      recommendation: 'Pokračuj v současné strategii.',
    }
  }

  // Fetch insights for each post in parallel
  const results = await Promise.all(
    recent.map(async post => {
      const igId = post.instagram_post_id as string
      const insights = await fetchInsights(igId)
      return { post, insights }
    })
  )

  let totalReach = 0
  let totalLikes = 0
  let totalSaves = 0
  let topIdx = 0

  results.forEach(({ insights }, i) => {
    totalReach += insights.reach
    totalLikes += insights.likes
    totalSaves += insights.saves
    if (insights.reach > results[topIdx].insights.reach) topIdx = i
  })

  const { post: topPostRow, insights: topInsights } = results[topIdx]
  const avgEngagement = totalReach > 0
    ? Math.round(((totalLikes + totalSaves) / totalReach) * 100 * 10) / 10
    : 0

  return {
    topPost: {
      id:    topPostRow.instagram_post_id as string,
      reach: topInsights.reach,
      likes: topInsights.likes,
      saves: topInsights.saves,
      url:   `instagram.com/p/${topPostRow.instagram_post_id}`,
    },
    totalReach,
    totalLikes,
    totalSaves,
    avgEngagement,
    recommendation: recommendation(topPostRow.post_type as string),
  }
}
