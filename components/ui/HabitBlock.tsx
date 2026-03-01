'use client'

interface Props {
  icon: string
  title: string
  children: React.ReactNode
}

export default function HabitBlock({ icon, title, children }: Props) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {title.toUpperCase()}
        </span>
      </div>
      {children}
    </div>
  )
}
