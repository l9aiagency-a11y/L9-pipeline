import { PostStatus, STATUS_LABELS } from '@/lib/types'

const colors: Record<PostStatus, string> = {
  pending_review:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  approved:          'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  waiting_for_video: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
  rendering:         'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  ready_for_review:  'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  scheduled:         'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  posted:            'bg-green-500/15 text-green-400 border border-green-500/20',
  failed:            'bg-red-500/15 text-red-400 border border-red-500/20',
}

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
