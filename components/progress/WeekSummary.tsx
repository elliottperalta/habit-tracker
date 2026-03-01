'use client'

import { WeekSummary } from '@/types'

interface Props {
  summary: WeekSummary
}

const colors = {
  solid: { bg: '#16a34a22', border: '#22c55e', dot: 'var(--green)', text: '#22c55e' },
  irregular: { bg: '#ca8a0422', border: '#eab308', dot: 'var(--yellow)', text: '#eab308' },
  low: { bg: '#dc262622', border: '#ef4444', dot: 'var(--red)', text: '#ef4444' },
}

export default function WeekSummaryCard({ summary }: Props) {
  const c = colors[summary.status]

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: c.bg, border: `1px solid ${c.border}22` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: c.dot, flexShrink: 0 }}
        />
        <span className="font-bold text-base" style={{ color: c.text }}>
          {summary.label}
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {summary.message}
      </p>
    </div>
  )
}
