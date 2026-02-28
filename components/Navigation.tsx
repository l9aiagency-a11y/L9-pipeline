'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/viral', label: 'Viral Ideas' },
  { href: '/media', label: 'Média' },
  { href: '/settings', label: 'Nastavení' },
]

export function Navigation() {
  const pathname = usePathname()
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-0.5 px-6">
        {/* Logo */}
        <div className="mr-8 flex items-center gap-2.5 py-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0077FF]">
            <span className="font-mono text-xs font-black text-white tracking-tighter">L9</span>
          </div>
          <span className="text-sm font-semibold text-white/80 tracking-tight">AI Studios</span>
        </div>

        {NAV.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`relative px-3.5 py-3.5 text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[#0077FF]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
