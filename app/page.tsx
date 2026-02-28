'use client'
import { useEffect, useState } from 'react'
import { Post, POST_TYPE_EMOJI } from '@/lib/types'
import { getFullWeekSchedule, getTodaySchedule, formatCzechDate, getWeekNumber } from '@/lib/schedule'
import { PostCard } from '@/components/PostCard'
import { ManualGenerate } from '@/components/ManualGenerate'
import { StatusBadge } from '@/components/StatusBadge'

const LS_KEY = 'l9_posts'

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
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
      })
      .catch(() => {
        setPosts(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'))
      })
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(posts))
  }, [posts])

  const updatePost = (updated: Post) =>
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))

  const addPosts = (newPosts: Post[]) => {
    setPosts(prev => {
      const map = new Map(prev.map(p => [p.id, p]))
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
    <div className="min-h-screen bg-[#050505]">
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/25 mb-1">
              Týden {weekNumber} · {czechDate}
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {POST_TYPE_EMOJI[today.type]}&nbsp; {today.label}
            </h1>
          </div>
          <div className="pt-1">
            <ManualGenerate onGenerated={addPosts} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Čeká na schválení', value: counts.pending,  dot: 'bg-amber-400' },
            { label: 'Schváleno',          value: counts.approved, dot: 'bg-emerald-400' },
            { label: 'Zveřejněno',         value: counts.posted,   dot: 'bg-purple-400' },
          ].map(({ label, value, dot }) => (
            <div key={label} className="rounded-2xl bg-[#0C0C0C] border border-white/[0.06] px-4 py-3.5 flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
              <div>
                <div className="text-xl font-bold text-white tabular-nums">{value}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/25">Tento týden</h2>
          <div className="grid grid-cols-7 gap-2">
            {weekSchedule.map(({ dayOfWeek, short, type }) => {
              const post = dayOfWeek === today.dayOfWeek
                ? todayPost
                : posts.find(p => p.day_of_week === dayOfWeek && p.week_number === weekNumber)
              const isToday = dayOfWeek === today.dayOfWeek
              return (
                <div
                  key={dayOfWeek}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    isToday
                      ? 'border-[#0077FF]/50 bg-[#0077FF]/8'
                      : 'border-white/[0.05] bg-[#0C0C0C]'
                  }`}
                >
                  <div className={`text-[10px] font-semibold mb-2 ${isToday ? 'text-[#4DA6FF]' : 'text-white/25'}`}>
                    {short}
                  </div>
                  <div className="text-base leading-none mb-2">{POST_TYPE_EMOJI[type]}</div>
                  {post
                    ? <StatusBadge status={post.status} />
                    : <div className="h-5 rounded-full bg-white/[0.04] w-full" />
                  }
                </div>
              )
            })}
          </div>
        </section>

        {/* Today's variants */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
              {todayPosts.length > 1 ? 'Dnešní varianty' : 'Dnešní post'}
            </h2>
            {todayPosts.length > 1 && (
              <span className="rounded-full bg-[#0077FF]/20 px-2 py-0.5 text-[10px] font-semibold text-[#4DA6FF]">
                {todayPosts.length}
              </span>
            )}
          </div>
          {todayPosts.length > 0 ? (
            <div className="space-y-4">
              {todayPosts.map(post => (
                <PostCard key={post.id} post={post} onUpdate={updatePost} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.07] bg-[#0A0A0A] p-10 text-center">
              <div className="text-3xl mb-3 opacity-50">{POST_TYPE_EMOJI[today.type]}</div>
              <div className="text-sm text-white/30 mb-1">Žádný post pro dnešek</div>
              <div className="text-xs text-white/15">
                Klikni <span className="text-[#4DA6FF]/60">+ 3 varianty</span> vpravo nahoře
              </div>
            </div>
          )}
        </section>

        {/* History */}
        {posts.filter(p => !todayIds.has(p.id)).length > 0 && (
          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-white/25">Historie</h2>
            <div className="space-y-4">
              {posts.filter(p => !todayIds.has(p.id)).map(post => (
                <PostCard key={post.id} post={post} onUpdate={updatePost} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
