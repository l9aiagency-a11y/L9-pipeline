export type PostType =
  | 'educational'
  | 'social_proof'
  | 'behind_the_scenes'
  | 'problem_solution'
  | 'promotional'
  | 'inspirational'
  | 'tips_tricks'

export type PostStatus =
  | 'pending_review'
  | 'approved'
  | 'waiting_for_video'
  | 'rendering'
  | 'ready_for_review'
  | 'scheduled'
  | 'posted'
  | 'failed'

export interface Post {
  id: string
  post_type: PostType
  day_of_week: number
  week_number: number
  ig_caption: string
  hashtags: string[]
  voiceover_script: string
  video_brief: string
  engagement_score: number
  engagement_reason: string
  best_time: string
  cta: string
  status: PostStatus
  generated_at: string
  approved_at?: string
  video_uploaded_at?: string
  render_started_at?: string
  render_completed_at?: string
  video_url?: string
  cover_url?: string
  scheduled_for?: string
  posted_at?: string
  instagram_post_id?: string
  regeneration_count: number
  whatsapp_message_sid?: string
  render_id?: string
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  educational: 'Vzdělávací',
  social_proof: 'Sociální důkaz',
  behind_the_scenes: 'Za oponou',
  problem_solution: 'Problém/Řešení',
  promotional: 'Propagační',
  inspirational: 'Inspirativní',
  tips_tricks: 'Tipy & triky',
}

export const POST_TYPE_EMOJI: Record<PostType, string> = {
  educational: '📚',
  social_proof: '🏆',
  behind_the_scenes: '🎬',
  problem_solution: '🔥',
  promotional: '🚀',
  inspirational: '✨',
  tips_tricks: '💡',
}

export const STATUS_LABELS: Record<PostStatus, string> = {
  pending_review: 'Čeká na schválení',
  approved: 'Schváleno',
  waiting_for_video: 'Čeká na video',
  rendering: 'Renderuje se',
  ready_for_review: 'Připraveno ke kontrole',
  scheduled: 'Naplánováno',
  posted: 'Zveřejněno',
  failed: 'Chyba',
}

// ─── Viral Ideas ─────────────────────────────────────────────────────────────

export type ViralStatus = 'new' | 'scripted' | 'recorded' | 'posted'

export interface ViralIdea {
  id: string
  generated_at: string
  title: string
  hook: string
  script: string
  visual_notes: string
  hashtags: string[]
  music_suggestion: string
  cta: string
  duration_seconds: number
  platform: 'tiktok' | 'reel' | 'both'
  estimated_reach: string
  status: ViralStatus
  audio_url?: string
  topic_hint?: string
}

export const VIRAL_STATUS_LABELS: Record<ViralStatus, string> = {
  new: 'Nový nápad',
  scripted: 'Scénář hotový',
  recorded: 'Natočeno',
  posted: 'Zveřejněno',
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  anthropic_api_key: string
  telegram_bot_token: string
  telegram_chat_id: string
  telegram_webhook_secret: string
  elevenlabs_api_key: string
  elevenlabs_voice_id: string
  instagram_access_token: string
  instagram_business_account_id: string
  meta_app_id: string
  meta_app_secret: string
  cron_secret: string
}

// ─── Media ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  uploaded_at: string
  url: string
  tags: string[]
  used_in?: string[]
}
