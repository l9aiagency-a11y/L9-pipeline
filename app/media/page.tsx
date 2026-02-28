'use client'
import { useEffect, useRef, useState } from 'react'
import { upload as blobUpload } from '@vercel/blob/client'
import { MediaItem } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, Copy, Check, Trash2, Film as FilmIcon, Image as ImageIcon } from 'lucide-react'

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/media')
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [])

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setUploadProgress(0)
    const uploaded: MediaItem[] = []
    for (const file of Array.from(files)) {
      try {
        const blob = await blobUpload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/media/upload-url',
          onUploadProgress: (progress) => {
            setUploadProgress(progress.percentage)
          },
        })
        const item: MediaItem = {
          id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          filename: file.name.replace(/\s+/g, '_'),
          original_name: file.name,
          mime_type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
          url: blob.url,
          tags: [],
        }
        await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
        uploaded.push(item)
      } catch (err) {
        console.error('Upload failed:', file.name, err)
      }
    }
    setItems(prev => [...uploaded, ...prev])
    setUploading(false)
    setUploadProgress(0)
  }

  const remove = async (id: string) => {
    if (!confirm('Smazat soubor?')) return
    await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(i => i.id !== id))
    if (selected === id) setSelected(null)
  }

  const copyUrl = async (item: MediaItem) => {
    await navigator.clipboard.writeText(item.url)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    upload(e.dataTransfer.files)
  }

  const filtered = items.filter(i => {
    if (filter === 'image') return i.mime_type.startsWith('image/')
    if (filter === 'video') return i.mime_type.startsWith('video/')
    return true
  })

  const selectedItem = items.find(i => i.id === selected)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-6 md:px-6 md:pt-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Media</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} souboru &middot; {formatSize(items.reduce((s, i) => s + i.size, 0))} celkem</p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {uploading ? `Nahravam ${uploadProgress}%` : 'Nahrat'}
          </button>
          <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => upload(e.target.files)} />
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl mx-4 md:mx-6 p-8 text-center transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground">Pretahni videa nebo fotky</div>
          <div className="text-xs text-muted-foreground mt-1">MP4, MOV, JPG, PNG &middot; max 500 MB</div>
          {uploading && (
            <div className="mt-4 mx-auto max-w-xs">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{uploadProgress}%</div>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 md:px-6">
          {([
            { key: 'all' as const, label: 'Vse' },
            { key: 'image' as const, label: 'Obrazky', icon: ImageIcon },
            { key: 'video' as const, label: 'Videa', icon: FilmIcon },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                filter === key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex gap-4 px-4 pb-6 md:px-6 md:pb-8">
          {/* Grid */}
          <div className="flex-1">
            {initialLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm text-muted-foreground mb-1">Zadna media</div>
                <div className="text-xs text-muted-foreground/60">Nahraj soubory pomoci tlacitka vyse</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filtered.map(item => (
                  <div
                    key={item.id}
                    className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-square bg-card ${
                      selected === item.id ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelected(selected === item.id ? null : item.id)}
                  >
                    {item.mime_type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.original_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FilmIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* File type badge */}
                    <span className="absolute top-2 right-2 rounded-full bg-black/70 text-white text-xs px-2 py-0.5">
                      {item.mime_type.startsWith('image/') ? 'IMG' : 'VID'}
                    </span>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); copyUrl(item) }}
                        className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                      >
                        {copiedId === item.id ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); remove(item.id) }}
                        className="rounded-full bg-white/20 p-2 hover:bg-red-500/50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedItem && (
            <div className="w-64 shrink-0 rounded-xl border border-border bg-card p-4 space-y-3 self-start hidden md:block">
              {selectedItem.mime_type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedItem.url} alt={selectedItem.original_name} className="w-full rounded-lg" />
              ) : (
                <video src={selectedItem.url} controls className="w-full rounded-lg" />
              )}
              <div className="text-xs text-foreground font-medium break-all">{selectedItem.original_name}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{selectedItem.mime_type}</div>
                <div>{formatSize(selectedItem.size)}</div>
                <div>{formatDate(selectedItem.uploaded_at)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(selectedItem)}
                  className="flex-1 text-xs rounded-full border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
                >
                  {copiedId === selectedItem.id ? <><Check className="h-3 w-3" /> OK</> : <><Copy className="h-3 w-3" /> Kopirovat</>}
                </button>
                <button
                  onClick={() => remove(selectedItem.id)}
                  className="text-xs rounded-full border border-red-500/20 text-red-400 px-3 py-1.5 hover:border-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
