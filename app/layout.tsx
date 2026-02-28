import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'L9 AI Studios — Content Pipeline',
  description: 'Content pipeline pro L9 AI Studios',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-[#050505]">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
