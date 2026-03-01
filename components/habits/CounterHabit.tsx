'use client'

import { Habit, HabitLog } from '@/types'
import { getEntrenoWeekStatus } from '@/lib/streaks'
import HabitBlock from '@/components/ui/HabitBlock'
import StreakBadge from '@/components/ui/StreakBadge'

interface Props {
  habit: Habit
  weekLogs: HabitLog[]
  weekStreak: number
  onAdd: () => void
  dragHandle?: React.ReactNode
}

export default function CounterHabit({ habit, weekLogs, weekStreak, onAdd, dragHandle }: Props) {
  const current = weekLogs.length
  const goal = habit.weekly_goal
  const status = getEntrenoWeekStatus(weekStreak)

  // Barras visuales de semana
  const bars = Array.from({ length: goal }, (_, i) => i < current)

  return (
    <HabitBlock icon={habit.icon ?? '🏋️'} title={habit.name} dragHandle={dragHandle}>
      <div className="flex items-center justify-between">
        {/* Barras semana */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 items-center">
            {bars.map((filled, i) => (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  width: 28,
                  height: 8,
                  borderRadius: 4,
                  background: filled ? 'var(--accent)' : 'var(--border)',
                }}
              />
            ))}
            <span
              className="text-sm font-bold ml-1"
              style={{ color: current >= goal ? 'var(--green)' : 'var(--text)' }}
            >
              {current}/{goal}
            </span>
          </div>
          <StreakBadge status={status} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {weekStreak} {weekStreak === 1 ? 'semana' : 'semanas'} seguidas
          </span>
        </div>

        {/* Botón +1 */}
        <button
          onClick={onAdd}
          disabled={current >= goal}
          className="px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95"
          style={{
            background: current >= goal ? 'var(--surface2)' : 'var(--accent)',
            color: current >= goal ? 'var(--text-muted)' : '#fff',
            border: '1px solid var(--border)',
            cursor: current >= goal ? 'default' : 'pointer',
          }}
        >
          {current >= goal ? '✓ Listo' : '+1'}
        </button>
      </div>
    </HabitBlock>
  )
}
