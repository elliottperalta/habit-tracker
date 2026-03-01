'use client'

import { Habit, HabitLog } from '@/types'
import { getMinutesProgress } from '@/lib/streaks'
import { pct } from '@/lib/utils'
import HabitBlock from '@/components/ui/HabitBlock'
import StreakBadge from '@/components/ui/StreakBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import QuickButtons from '@/components/ui/QuickButtons'

interface Props {
  habit: Habit
  weekLogs: HabitLog[]
  onAdd: (minutes: number) => void
  dragHandle?: React.ReactNode
}

export default function MinutesHabit({ habit, weekLogs, onAdd, dragHandle }: Props) {
  const current = weekLogs.reduce((sum, l) => sum + l.value, 0)
  const goal = habit.weekly_goal
  const progress = pct(current, goal)
  const status = getMinutesProgress(current, goal)

  const progressColor =
    progress >= 1 ? 'var(--green)' : progress >= 0.25 ? 'var(--accent)' : 'var(--text-muted)'

  return (
    <HabitBlock icon={habit.icon ?? '📖'} title={habit.name} dragHandle={dragHandle}>
      <div className="flex items-center justify-between">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: progress >= 1 ? 'var(--green)' : 'var(--text)' }}
        >
          {current}
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
            / {goal} min
          </span>
        </span>
        <StreakBadge status={status} />
      </div>

      <ProgressBar value={progress} color={progressColor} height={5} animated />

      <QuickButtons amounts={[10, 15, 20]} unit="min" onAdd={onAdd} />
    </HabitBlock>
  )
}
