'use client'

interface Props {
  icon: string
  title: string
  children: React.ReactNode
  dragHandle?: React.ReactNode
}

export default function HabitBlock({ icon, title, children, dragHandle }: Props) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold tracking-wide flex-1" style={{ color: 'var(--text-muted)' }}>
          {title.toUpperCase()}
        </span>
        {dragHandle}
      </div>
      {children}
    </div>
  )
}
