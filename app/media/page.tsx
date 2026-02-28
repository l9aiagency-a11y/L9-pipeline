'use client'
import { useEffect, useRef, useState } from 'react'
import { upload as blobUpload } from '@vercel/blob/client'
import { MediaItem } from '@/lib/types'

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
  const [selected, setSelected] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [uploadProgress, setUploadProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/media').then(r => r.json()).then(setItems).catch(() => {})
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
        // Save to backend store
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
    upload(e.dataTransfer.files)
  }

  const filtered = items.filter(i => {
    if (filter === 'image') return i.mime_type.startsWith('image/')
    if (filter === 'video') return i.mime_type.startsWith('video/')
    return true
  })

  const selectedItem = items.find(i => i.id === selected)

  return (
    <div className="min-h-screen bg-[#050505]">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">🎬 Média</h1>
            <p className="text-sm text-gray-500">{items.length} souborů · {formatSize(items.reduce((s, i) => s + i.size, 0))} celkem</p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-[#0077FF] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0066DD] disabled:opacity-50 transition-colors"
          >
            {uploading ? `⏳ Nahrávám… ${uploadProgress}%` : '⬆ Nahrát soubory'}
          </button>
          <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => upload(e.target.files)} />
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-[#1a1a1a] rounded-xl p-6 text-center text-gray-600 text-sm mb-6 hover:border-[#0077FF]/50 transition-colors"
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          Přetáhni fotky nebo videa sem · nebo klikni Nahrát soubory výše
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'image', 'video'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-[#0077FF] text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'}`}
            >
              {f === 'all' ? 'Vše' : f === 'image' ? '🖼 Obrázky' : '🎥 Videa'}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Grid */}
          <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  selected === item.id ? 'border-[#0077FF]' : 'border-transparent'
                }`}
                onClick={() => setSelected(selected === item.id ? null : item.id)}
              >
                {item.mime_type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.original_name} className="w-full aspect-square object-cover bg-[#0E0E0E]" />
                ) : (
                  <div className="w-full aspect-square bg-[#0E0E0E] flex items-center justify-center">
                    <span className="text-3xl">🎥</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-xs text-white truncate">{item.original_name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedItem && (
            <div className="w-64 shrink-0 rounded-xl border border-[#1a1a1a] bg-[#0E0E0E] p-4 space-y-3 self-start">
              {selectedItem.mime_type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedItem.url} alt={selectedItem.original_name} className="w-full rounded-lg" />
              ) : (
                <video src={selectedItem.url} controls className="w-full rounded-lg" />
              )}
              <div className="text-xs text-white font-medium break-all">{selectedItem.original_name}</div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>{selectedItem.mime_type}</div>
                <div>{formatSize(selectedItem.size)}</div>
                <div>{formatDate(selectedItem.uploaded_at)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(selectedItem)}
                  className="flex-1 text-xs bg-[#1a1a1a] text-gray-300 px-2 py-1.5 rounded-lg hover:bg-[#252525] transition-colors"
                >
                  {copiedId === selectedItem.id ? '✅ OK' : '📋 Kopírovat'}
                </button>
                <button
                  onClick={() => remove(selectedItem.id)}
                  className="text-xs bg-red-900/20 text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
