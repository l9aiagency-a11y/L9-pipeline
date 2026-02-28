import { PostType } from './types'

export const WEEKLY_SCHEDULE: Record<number, { type: PostType; label: string; short: string }> = {
  0: { type: 'tips_tricks', label: 'Neděle', short: 'NED' },
  1: { type: 'educational', label: 'Pondělí', short: 'PON' },
  2: { type: 'social_proof', label: 'Úterý', short: 'ÚT' },
  3: { type: 'behind_the_scenes', label: 'Středa', short: 'STŘ' },
  4: { type: 'problem_solution', label: 'Čtvrtek', short: 'ČTV' },
  5: { type: 'promotional', label: 'Pátek', short: 'PÁT' },
  6: { type: 'inspirational', label: 'Sobota', short: 'SOB' },
}

export function getWeekNumber(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getTodaySchedule() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const schedule = WEEKLY_SCHEDULE[dayOfWeek]
  return { ...schedule, dayOfWeek, weekNumber: getWeekNumber(now) }
}

export function getFullWeekSchedule() {
  return [1, 2, 3, 4, 5, 6, 0].map(day => ({ dayOfWeek: day, ...WEEKLY_SCHEDULE[day] }))
}

export function formatCzechDate(date = new Date()): string {
  const day = WEEKLY_SCHEDULE[date.getDay()].label
  return `${day} ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}
