'use client'
import { useState } from 'react'

export function CanvaPromptCard({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-r-lg border-l-2 border-[#0077FF] bg-[#0E1A2B] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[#4DA6FF]">🎨 Canva Brief</span>
        <button
          onClick={copy}
          className="rounded px-2 py-0.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? '✓ Zkopírováno' : 'Kopírovat'}
        </button>
      </div>
      <p className="font-mono text-xs leading-relaxed text-gray-300">{prompt}</p>
      <p className="mt-2 text-xs text-gray-600">1080×1080px feed · 1080×1920px story</p>
    </div>
  )
}
