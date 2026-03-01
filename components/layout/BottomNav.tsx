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
      className="fixed bottom-0 left-0 right-0 safe-bottom z-50"
      style={{
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200',
                active ? 'opacity-100' : 'opacity-40 hover:opacity-60'
              )}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span
                className="text-xs font-medium"
                style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
              >
                {tab.label}
              </span>
              {active && (
                <span
                  className="w-1 h-1 rounded-full"
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
