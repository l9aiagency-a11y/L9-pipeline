'use client'
import { useEffect, useState } from 'react'
import { Post, POST_TYPE_EMOJI } from '@/lib/types'
import { getFullWeekSchedule, getTodaySchedule, formatCzechDate, getWeekNumber } from '@/lib/schedule'
import { PostCard } from '@/components/PostCard'
import { ManualGenerate } from '@/components/ManualGenerate'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { PipelineStatus } from '@/components/PipelineStatus'

const LS_KEY = 'l9_posts'

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const today = getTodaySchedule()
  const weekNumber = getWeekNumber()
  const czechDate = formatCzechDate()
  const weekSchedule = getFullWeekSchedule()

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then((apiPosts: Post[]) => {
        const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Post[]
        const merged = new Map<string, Post>()
        ;[...stored, ...apiPosts].forEach(p => {
          const existing = merged.get(p.id)
          if (!existing || new Date(p.generated_at) > new Date(existing.generated_at)) {
            merged.set(p.id, p)
          }
        })
        setPosts(Array.from(merged.values()).sort(
          (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
        ))
        setLoading(false)
      })
      .catch(() => {
        setPosts(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(posts))
  }, [posts])

  const updatePost = (updated: Post) =>
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))

  const addPosts = (newPosts: Post[]) => {
    setPosts(prev => {
      // Remove old today's posts, keep everything else
      const withoutToday = prev.filter(
        p => !(p.day_of_week === today.dayOfWeek && p.week_number === weekNumber)
      )
      const map = new Map(withoutToday.map(p => [p.id, p]))
      newPosts.forEach(p => map.set(p.id, p))
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
      )
    })
  }

  const todayPosts = posts.filter(p => p.day_of_week === today.dayOfWeek && p.week_number === weekNumber)
  const todayPost =
    todayPosts.find(p => p.status === 'approved') ??
    todayPosts.find(p => p.status === 'pending_review') ??
    todayPosts[0]
  const todayIds = new Set(todayPosts.map(p => p.id))

  const counts = {
    pending:  posts.filter(p => p.status === 'pending_review').length,
    approved: posts.filter(p => p.status === 'approved').length,
    posted:   posts.filter(p => p.status === 'posted').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-4 pt-6 md:px-6 md:pt-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {POST_TYPE_EMOJI[today.type]}&nbsp; {today.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Tyden {weekNumber} &middot; {czechDate}
            </p>
          </div>
          <ManualGenerate onGenerated={addPosts} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-4 md:px-6">
          {loading ? (
            <>
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </>
          ) : (
            [
              { label: 'Ceka na schvaleni', value: counts.pending, dot: 'bg-yellow-400' },
              { label: 'Schvaleno', value: counts.approved, dot: 'bg-green-400' },
              { label: 'Zverejneno', value: counts.posted, dot: 'bg-blue-400' },
            ].map(({ label, value, dot }) => (
              <div key={label} className="rounded-xl bg-card p-3 flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                <div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pipeline Status */}
        <div className="px-4 md:px-6">
          <PipelineStatus />
        </div>

        {/* Week calendar — horizontal scroll */}
        <div className="flex overflow-x-auto gap-2 px-4 py-1 md:px-6 scrollbar-hide">
          {weekSchedule.map(({ dayOfWeek, short, type }) => {
            const post = dayOfWeek === today.dayOfWeek
              ? todayPost
              : posts.find(p => p.day_of_week === dayOfWeek && p.week_number === weekNumber)
            const isToday = dayOfWeek === today.dayOfWeek
            return (
              <div
                key={dayOfWeek}
                className={`flex flex-col items-center gap-1.5 rounded-full px-3 py-2.5 min-w-[60px] shrink-0 transition-all ${
                  isToday
                    ? 'bg-primary text-white'
                    : 'bg-card text-muted-foreground'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{short}</span>
                <span className="text-sm leading-none">{POST_TYPE_EMOJI[type]}</span>
                {post ? (
                  <StatusBadge status={post.status} />
                ) : (
                  <div className="h-4 w-8 rounded-full bg-muted" />
                )}
              </div>
            )
          })}
        </div>

        {/* Today's variants */}
        <section className="px-4 md:px-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {todayPosts.length > 1 ? 'Dnesni varianty' : 'Dnesni post'}
            </h2>
            {todayPosts.length > 1 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {todayPosts.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : todayPosts.length > 0 ? (
            <div className="space-y-3">
              {todayPosts.map(post => (
                <PostCard key={post.id} post={post} onUpdate={updatePost} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="text-3xl mb-3 opacity-50">{POST_TYPE_EMOJI[today.type]}</div>
              <div className="text-sm text-muted-foreground mb-1">Zadny post pro dnesek</div>
              <div className="text-xs text-muted-foreground/60">
                Klikni <span className="text-primary">+ 3 varianty</span> vpravo nahore
              </div>
            </div>
          )}
        </section>

        {/* History */}
        {posts.filter(p => !todayIds.has(p.id)).length > 0 && (
          <section className="px-4 pb-6 md:px-6 md:pb-8">
            <h2 className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">Historie</h2>
            <div className="space-y-3">
              {posts.filter(p => !todayIds.has(p.id)).map(post => (
                <PostCard key={post.id} post={post} onUpdate={updatePost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
