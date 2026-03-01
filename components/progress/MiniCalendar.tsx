'use client'

interface Props {
  logDates: string[]
  days?: number
}

export default function MiniCalendar({ logDates, days = 7 }: Props) {
  const today = new Date()
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  // Últimos N días
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    const iso = d.toISOString().split('T')[0]
    const filled = logDates.includes(iso)
    const isToday = i === days - 1
    // Día de semana (0=Dom)
    const dow = d.getDay()
    const label = dayLabels[(dow + 6) % 7]
    return { iso, filled, isToday, label }
  })

  return (
    <div className="flex gap-1.5 justify-between">
      {cells.map((cell) => (
        <div key={cell.iso} className="flex flex-col items-center gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            {cell.label}
          </span>
          <div
            className="rounded-md transition-all duration-200"
            style={{
              width: 28,
              height: 28,
              background: cell.filled
                ? 'var(--accent)'
                : cell.isToday
                ? 'var(--surface2)'
                : 'var(--border)',
              border: cell.isToday ? '1px solid var(--accent)' : '1px solid transparent',
              opacity: cell.filled ? 1 : 0.5,
            }}
          />
        </div>
      ))}
    </div>
  )
}
