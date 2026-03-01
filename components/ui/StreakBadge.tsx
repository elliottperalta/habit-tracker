'use client'

import { StreakStatus } from '@/types'

interface Props {
  status: StreakStatus
  size?: 'sm' | 'md'
}

export default function StreakBadge({ status, size = 'md' }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        fontSize: size === 'sm' ? '11px' : '12px',
        color: 'var(--text-muted)',
      }}
    >
      <span>{status.emoji}</span>
      <span>{status.text}</span>
    </span>
  )
}
