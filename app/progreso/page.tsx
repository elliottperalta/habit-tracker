'use client'

import { useEffect } from 'react'
import { useHabitsStore } from '@/store/habits-store'
import { calculateStreak, calculateWeekStreak, getWeekRange } from '@/lib/streaks'
import { WeekSummary } from '@/types'
import WeekSummaryCard from '@/components/progress/WeekSummary'
import MiniCalendar from '@/components/progress/MiniCalendar'
import ProgressBar from '@/components/ui/ProgressBar'
import { pct } from '@/lib/utils'

function computeWeekSummary(
  habits: ReturnType<typeof useHabitsStore.getState>['habits'],
  getWeekLogs: (id: string) => ReturnType<typeof useHabitsStore.getState>['logs'],
  getLogsForHabit: (id: string) => ReturnType<typeof useHabitsStore.getState>['logs']
): WeekSummary {
  let score = 0
  let total = 0

  for (const habit of habits) {
    total++
    const weekLogs = getWeekLogs(habit.id)

    if (habit.type === 'sleep') {
      const r7 = getLogsForHabit(habit.id).slice(0, 7)
      const goodNights = r7.filter((l) => l.value >= 7).length
      if (goodNights >= 1) score++
    } else if (habit.type === 'check') {
      if (weekLogs.length >= 5) score++
    } else if (habit.type === 'counter') {
      if (weekLogs.length >= habit.weekly_goal) score++
      else if (weekLogs.length >= Math.ceil(habit.weekly_goal / 2)) score += 0.5
    } else if (habit.type === 'minutes') {
      const current = weekLogs.reduce((s, l) => s + l.value, 0)
      if (current >= habit.weekly_goal) score++
      else if (current > 0) score += 0.5
    }
  }

  const ratio = total > 0 ? score / total : 0

  if (ratio >= 0.75) {
    return {
      status: 'solid',
      label: 'Semana sólida',
      message: 'Estás construyendo algo real. Sigue así.',
    }
  } else if (ratio >= 0.4) {
    return {
      status: 'irregular',
      label: 'Semana irregular',
      message: 'Avanzaste en algunas cosas. Hay margen para más.',
    }
  } else {
    return {
      status: 'low',
      label: 'Semana floja',
      message: 'Todo comienza de nuevo mañana. Sin culpa.',
    }
  }
}

export default function ProgresoPage() {
  const { habits, fetchHabits, fetchLogs, getLogsForHabit, getWeekLogs } = useHabitsStore()

  useEffect(() => {
    fetchHabits()
    fetchLogs(90)
  }, [])

  const weekSummary = computeWeekSummary(habits, getWeekLogs, getLogsForHabit)

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-4">
      {/* Header */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
        Progreso
      </h1>

      {/* Resumen semanal */}
      <WeekSummaryCard summary={weekSummary} />

      {/* Tarjetas por hábito */}
      {habits.map((habit) => {
        const allLogs = getLogsForHabit(habit.id)
        const weekLogs = getWeekLogs(habit.id)
        const logDates = allLogs.map((l) => l.date)
        const streak = calculateStreak(logDates)

        return (
          <div
            key={habit.id}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Título */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{habit.icon ?? '📌'}</span>
                <span className="font-semibold text-sm">{habit.name}</span>
              </div>
              {habit.type !== 'sleep' && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Racha: {streak}d
                </span>
              )}
            </div>

            {/* Sueño */}
            {habit.type === 'sleep' && (() => {
              const last7 = allLogs.slice(0, 7)
              const avg =
                last7.length > 0
                  ? last7.reduce((s, l) => s + l.value, 0) / last7.length
                  : 0
              const goodNights = last7.filter((l) => l.value >= 7).length
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Promedio 7 días</span>
                    <span className="font-bold">{avg > 0 ? `${avg.toFixed(1)}h` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Noches ≥7h</span>
                    <span className="font-bold">{goodNights}/7</span>
                  </div>
                  <MiniCalendar
                    logDates={allLogs.filter((l) => l.value >= 7).map((l) => l.date)}
                  />
                </div>
              )
            })()}

            {/* Check (creatina) */}
            {habit.type === 'check' && (() => {
              const last7 = logDates.slice(0, 7).length
              const pct7 = Math.round((last7 / 7) * 100)
              return (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Últimos 7 días</span>
                    <span className="font-bold">{pct7}%</span>
                  </div>
                  <ProgressBar
                    value={pct7 / 100}
                    color={pct7 >= 70 ? 'var(--green)' : 'var(--accent)'}
                    animated
                  />
                  <MiniCalendar logDates={logDates} />
                </div>
              )
            })()}

            {/* Counter (entreno) */}
            {habit.type === 'counter' && (() => {
              const today = new Date()
              const weeks = Array.from({ length: 4 }, (_, i) => {
                const { start, end } = getWeekRange(today, -i)
                const count = logDates.filter((d) => {
                  const date = new Date(d + 'T00:00:00')
                  return date >= start && date <= end
                }).length
                return { label: i === 0 ? 'Esta' : `−${i}s`, count }
              }).reverse()

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-end justify-between">
                    {weeks.map((w, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-xs font-bold">{w.count}</span>
                        <div
                          className="w-full rounded-t-sm"
                          style={{
                            height: Math.max(w.count * 10, 4),
                            background: w.count >= habit.weekly_goal ? 'var(--green)' : 'var(--accent)',
                            opacity: i === 3 ? 1 : 0.5,
                          }}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                          {w.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Minutes (lectura/inglés) */}
            {habit.type === 'minutes' && (() => {
              const today = new Date()
              const weeks = Array.from({ length: 4 }, (_, i) => {
                const { start, end } = getWeekRange(today, -i)
                const mins = allLogs
                  .filter((l) => {
                    const date = new Date(l.date + 'T00:00:00')
                    return date >= start && date <= end
                  })
                  .reduce((s, l) => s + l.value, 0)
                return { label: i === 0 ? 'Esta' : `−${i}s`, mins }
              }).reverse()

              const currentWeekMins = weekLogs.reduce((s, l) => s + l.value, 0)

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Esta semana</span>
                    <span className="font-bold">
                      {currentWeekMins}/{habit.weekly_goal} min
                    </span>
                  </div>
                  <ProgressBar
                    value={pct(currentWeekMins, habit.weekly_goal)}
                    color="var(--accent)"
                    animated
                  />
                  <div className="flex gap-2 items-end justify-between">
                    {weeks.map((w, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-xs font-bold">{w.mins}</span>
                        <div
                          className="w-full rounded-t-sm"
                          style={{
                            height: Math.max((w.mins / habit.weekly_goal) * 40, 4),
                            background:
                              w.mins >= habit.weekly_goal ? 'var(--green)' : 'var(--accent)',
                            opacity: i === 3 ? 1 : 0.5,
                          }}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                          {w.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}
