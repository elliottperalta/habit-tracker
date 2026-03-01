'use client'

interface Props {
  amounts: number[]
  unit?: string
  onAdd: (amount: number) => void
  disabled?: boolean
}

export default function QuickButtons({ amounts, unit = 'min', onAdd, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {amounts.map((amount) => (
        <button
          key={amount}
          onClick={() => onAdd(amount)}
          disabled={disabled}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: disabled ? 'var(--text-muted)' : 'var(--text)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          +{amount} {unit}
        </button>
      ))}
    </div>
  )
}
