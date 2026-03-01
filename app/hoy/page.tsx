'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { useHabitsStore } from '@/store/habits-store'
import { Habit } from '@/types'
import { calculateStreak, calculateWeekStreak } from '@/lib/streaks'
import SleepBlock from '@/components/habits/SleepBlock'
import CheckHabit from '@/components/habits/CheckHabit'
import CounterHabit from '@/components/habits/CounterHabit'
import MinutesHabit from '@/components/habits/MinutesHabit'

// ── Icono de agarre ──────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
      <circle cx="2" cy="2"  r="1.5" /><circle cx="8" cy="2"  r="1.5" />
      <circle cx="2" cy="7"  r="1.5" /><circle cx="8" cy="7"  r="1.5" />
      <circle cx="2" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" />
    </svg>
  )
}

// ── Wrapper sortable ─────────────────────────────────────────────────────────
function SortableCard({ habit, children }: { habit: Habit; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })

  const dragHandle = (
    <button
      {...listeners}
      {...attributes}
      className="touch-none cursor-grab active:cursor-grabbing flex items-center justify-center w-6 h-6 rounded-lg transition-opacity"
      style={{ color: 'var(--text-muted)', opacity: 0.35 }}
      tabIndex={-1}
    >
      <GripIcon />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'transform 200ms ease',
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
      }}
    >
      {children(dragHandle)}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function HoyPage() {
  const {
    habits, fetchHabits, fetchLogs,
    getTodayLog, getLogsForHabit, getWeekLogs,
    logSleep, logCheck, logCounter, logMinutes,
    reorderHabits, loading,
  } = useHabitsStore()

  useEffect(() => {
    fetchHabits()
    fetchLogs(60)
  }, [])

  const today = new Date()
  const dayName = today.toLocaleDateString('es', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('es', { day: 'numeric', month: 'long' })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = habits.findIndex((h) => h.id === active.id)
    const newIndex = habits.findIndex((h) => h.id === over.id)
    reorderHabits(arrayMove(habits, oldIndex, newIndex))
  }

  if (loading && habits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold capitalize" style={{ color: 'var(--text)' }}>
          {dayName}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {dateStr}
        </p>
      </div>

      {/* Lista ordenable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
          {habits.map((habit) => {
            const todayLog = getTodayLog(habit.id)
            const allLogs = getLogsForHabit(habit.id)
            const weekLogs = getWeekLogs(habit.id)
            const logDates = allLogs.map((l) => l.date)

            if (habit.type === 'sleep') {
              return (
                <SortableCard key={habit.id} habit={habit}>
                  {(handle) => (
                    <SleepBlock
                      habit={habit}
                      todayLog={todayLog}
                      onSave={(hours, quality) => logSleep(habit.id, hours, quality)}
                      dragHandle={handle}
                    />
                  )}
                </SortableCard>
              )
            }

            if (habit.type === 'check') {
              const streak = calculateStreak(logDates)
              return (
                <SortableCard key={habit.id} habit={habit}>
                  {(handle) => (
                    <CheckHabit
                      habit={habit}
                      todayLog={todayLog}
                      streak={streak}
                      onToggle={(done) => logCheck(habit.id, done)}
                      dragHandle={handle}
                    />
                  )}
                </SortableCard>
              )
            }

            if (habit.type === 'counter') {
              const weekStreak = calculateWeekStreak(logDates, habit.weekly_goal)
              return (
                <SortableCard key={habit.id} habit={habit}>
                  {(handle) => (
                    <CounterHabit
                      habit={habit}
                      weekLogs={weekLogs}
                      weekStreak={weekStreak}
                      onAdd={() => logCounter(habit.id)}
                      dragHandle={handle}
                    />
                  )}
                </SortableCard>
              )
            }

            if (habit.type === 'minutes') {
              return (
                <SortableCard key={habit.id} habit={habit}>
                  {(handle) => (
                    <MinutesHabit
                      habit={habit}
                      weekLogs={weekLogs}
                      onAdd={(mins) => logMinutes(habit.id, mins)}
                      dragHandle={handle}
                    />
                  )}
                </SortableCard>
              )
            }

            return null
          })}
        </SortableContext>
      </DndContext>

      {/* Botón gestionar */}
      <div className="flex justify-center mt-2">
        <Link
          href="/ajustes"
          className="text-xs py-2 px-4 rounded-xl transition-all"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          ⚙️ Gestionar hábitos
        </Link>
      </div>
    </div>
  )
}
