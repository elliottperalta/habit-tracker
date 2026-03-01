'use client'

interface Props {
  value: number // 0-1
  color?: string
  height?: number
  animated?: boolean
}

export default function ProgressBar({
  value,
  color = 'var(--accent)',
  height = 4,
  animated = false,
}: Props) {
  const pct = Math.min(Math.max(value, 0), 1) * 100

  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: 'var(--border)' }}
    >
      <div
        className={animated ? 'transition-all duration-700 ease-out' : ''}
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 9999,
          minWidth: pct > 0 ? 4 : 0,
        }}
      />
    </div>
  )
}
