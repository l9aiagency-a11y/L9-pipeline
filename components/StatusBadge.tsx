import { PostStatus, STATUS_LABELS } from '@/lib/types'

const colors: Record<PostStatus, string> = {
  pending_review:   'bg-amber-500/20 text-amber-400',
  approved:         'bg-emerald-500/20 text-emerald-400',
  waiting_for_video:'bg-sky-500/20 text-sky-400',
  rendering:        'bg-violet-500/20 text-violet-400',
  ready_for_review: 'bg-teal-500/20 text-teal-400',
  scheduled:        'bg-blue-500/20 text-blue-400',
  posted:           'bg-purple-500/20 text-purple-400',
  failed:           'bg-red-500/20 text-red-400',
}

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
