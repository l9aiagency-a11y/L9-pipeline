import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TopNav } from '@/components/TopNav'
import { BottomNav } from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'L9 AI Studios — Content Pipeline',
  description: 'Content pipeline pro L9 AI Studios',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <TopNav />
        <main className="pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
