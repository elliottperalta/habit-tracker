'use client'

import { Habit, HabitLog } from '@/types'
import { getCreatinaStreakStatus, getGenericStreakStatus } from '@/lib/streaks'
import HabitBlock from '@/components/ui/HabitBlock'
import StreakBadge from '@/components/ui/StreakBadge'

interface Props {
  habit: Habit
  todayLog: HabitLog | null
  streak: number
  onToggle: (done: boolean) => void
  dragHandle?: React.ReactNode
}

export default function CheckHabit({ habit, todayLog, streak, onToggle, dragHandle }: Props) {
  const done = !!todayLog

  // Usar estados de creatina si es creatina, sino estados genéricos
  const status =
    habit.name === 'Creatina'
      ? getCreatinaStreakStatus(streak)
      : getGenericStreakStatus(streak, habit.name)

  return (
    <HabitBlock icon={habit.icon ?? '✓'} title={habit.name} dragHandle={dragHandle}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <StreakBadge status={status} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Racha: {streak} {streak === 1 ? 'día' : 'días'}
          </span>
        </div>

        {/* Toggle grande */}
        <button
          onClick={() => onToggle(!done)}
          className="relative transition-all duration-300 active:scale-95"
          style={{
            width: 64,
            height: 36,
            borderRadius: 18,
            background: done ? 'var(--green)' : 'var(--surface2)',
            border: `1px solid ${done ? 'var(--green)' : 'var(--border)'}`,
          }}
        >
          <span
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 rounded-full"
            style={{
              width: 26,
              height: 26,
              background: '#fff',
              left: done ? 34 : 4,
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          />
        </button>
      </div>
    </HabitBlock>
  )
}
