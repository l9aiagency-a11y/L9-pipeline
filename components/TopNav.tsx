'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/viral', label: 'Viral Ideas' },
  { href: '/media', label: 'Média' },
  { href: '/settings', label: 'Nastavení' },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:block sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-6">
        {/* Logo */}
        <div className="mr-8 flex items-center gap-2.5 py-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-black text-white tracking-tighter">L9</span>
          </div>
          <span className="text-sm font-semibold text-foreground/80 tracking-tight">AI Studios</span>
        </div>

        {NAV.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`relative px-3.5 py-3.5 text-sm font-medium transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
