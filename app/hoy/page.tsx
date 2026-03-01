'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useHabitsStore } from '@/store/habits-store'
import { calculateStreak, calculateWeekStreak, getThisWeekLogs } from '@/lib/streaks'
import SleepBlock from '@/components/habits/SleepBlock'
import CheckHabit from '@/components/habits/CheckHabit'
import CounterHabit from '@/components/habits/CounterHabit'
import MinutesHabit from '@/components/habits/MinutesHabit'

export default function HoyPage() {
  const {
    habits,
    fetchHabits,
    fetchLogs,
    getTodayLog,
    getLogsForHabit,
    getWeekLogs,
    logSleep,
    logCheck,
    logCounter,
    logMinutes,
    loading,
  } = useHabitsStore()

  useEffect(() => {
    fetchHabits()
    fetchLogs(60)
  }, [])

  const today = new Date()
  const dayName = today.toLocaleDateString('es', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('es', { day: 'numeric', month: 'long' })

  if (loading && habits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-10 pb-4">
      {/* Header */}
      <div className="mb-2">
        <h1
          className="text-xl font-bold capitalize"
          style={{ color: 'var(--text)' }}
        >
          {dayName}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {dateStr}
        </p>
      </div>

      {/* Bloques de hábitos */}
      {habits.map((habit) => {
        const todayLog = getTodayLog(habit.id)
        const allLogs = getLogsForHabit(habit.id)
        const weekLogs = getWeekLogs(habit.id)
        const logDates = allLogs.map((l) => l.date)

        if (habit.type === 'sleep') {
          return (
            <SleepBlock
              key={habit.id}
              habit={habit}
              todayLog={todayLog}
              onSave={(hours, quality) => logSleep(habit.id, hours, quality)}
            />
          )
        }

        if (habit.type === 'check') {
          const streak = calculateStreak(logDates)
          return (
            <CheckHabit
              key={habit.id}
              habit={habit}
              todayLog={todayLog}
              streak={streak}
              onToggle={(done) => logCheck(habit.id, done)}
            />
          )
        }

        if (habit.type === 'counter') {
          const weekStreak = calculateWeekStreak(logDates, habit.weekly_goal)
          return (
            <CounterHabit
              key={habit.id}
              habit={habit}
              weekLogs={weekLogs}
              weekStreak={weekStreak}
              onAdd={() => logCounter(habit.id)}
            />
          )
        }

        if (habit.type === 'minutes') {
          return (
            <MinutesHabit
              key={habit.id}
              habit={habit}
              weekLogs={weekLogs}
              onAdd={(mins) => logMinutes(habit.id, mins)}
            />
          )
        }

        return null
      })}

      {/* Botón gestionar */}
      <div className="flex justify-center mt-2">
        <Link
          href="/ajustes"
          className="text-xs py-2 px-4 rounded-xl transition-all"
          style={{
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          ⚙️ Gestionar hábitos
        </Link>
      </div>
    </div>
  )
}
