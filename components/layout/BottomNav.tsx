'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/hoy', label: 'Hoy', icon: '☀️' },
  { href: '/progreso', label: 'Progreso', icon: '📊' },
  { href: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-11 max-w-lg mx-auto px-4">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative',
                active ? 'opacity-100' : 'opacity-35 hover:opacity-55'
              )}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              {active && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
