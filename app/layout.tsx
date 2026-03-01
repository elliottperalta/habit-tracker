import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/layout/BottomNav'
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister'
import AuthProvider from '@/components/layout/AuthProvider'

export const metadata: Metadata = {
  title: 'Hábitos',
  description: 'Tracker de hábitos minimalista',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hábitos',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <ServiceWorkerRegister />
        <AuthProvider>
          <main className="max-w-lg mx-auto min-h-screen" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
