'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHabitsStore } from '@/store/habits-store'

export default function EditarHabitoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { habits, updateHabit, fetchHabits } = useHabitsStore()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (habits.length === 0) fetchHabits()
  }, [])

  const habit = habits.find((h) => h.id === params.id)

  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState(habit?.icon ?? '📌')
  const [weeklyGoal, setWeeklyGoal] = useState(habit?.weekly_goal ?? 7)
  const [notificationEnabled, setNotificationEnabled] = useState(
    habit?.notification_enabled ?? false
  )
  const [notificationTime, setNotificationTime] = useState(habit?.notification_time ?? '20:00')
  const [notifyIfNotDone, setNotifyIfNotDone] = useState(habit?.notify_if_not_done ?? true)

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setIcon(habit.icon ?? '📌')
      setWeeklyGoal(habit.weekly_goal)
      setNotificationEnabled(habit.notification_enabled)
      setNotificationTime(habit.notification_time ?? '20:00')
      setNotifyIfNotDone(habit.notify_if_not_done)
    }
  }, [habit?.id])

  if (!habit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span style={{ color: 'var(--text-muted)' }}>Hábito no encontrado</span>
      </div>
    )
  }

  async function handleSave() {
    setSaving(true)
    await updateHabit(params.id, {
      name: name.trim(),
      icon,
      weekly_goal: weeklyGoal,
      notification_enabled: notificationEnabled,
      notification_time: notificationEnabled ? notificationTime : null,
      notify_if_not_done: notifyIfNotDone,
    })
    setSaving(false)
    router.push('/ajustes')
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-10 pb-4 min-h-screen">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ← Volver
        </button>
        <h1 className="text-lg font-bold flex-1">Editar hábito</h1>
      </div>

      {/* Nombre */}
      <div className="flex flex-col gap-2">
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Nombre</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={2}
            className="w-14 text-center text-xl rounded-xl py-3 outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl px-4 py-3 outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-2">
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Meta{' '}
          {habit.type === 'minutes' ? '(min/semana)' : '(veces/semana)'}
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - (habit.type === 'minutes' ? 15 : 1)))}
            className="w-12 h-12 rounded-full text-xl font-bold"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            −
          </button>
          <span className="text-4xl font-bold flex-1 text-center tabular-nums">{weeklyGoal}</span>
          <button
            onClick={() => setWeeklyGoal(weeklyGoal + (habit.type === 'minutes' ? 15 : 1))}
            className="w-12 h-12 rounded-full text-xl font-bold"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      {habit.type !== 'sleep' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Notificación</label>
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-sm">Activar notificación</span>
            <button
              onClick={() => setNotificationEnabled(!notificationEnabled)}
              className="relative transition-all duration-300"
              style={{
                width: 48, height: 28, borderRadius: 14,
                background: notificationEnabled ? 'var(--accent)' : 'var(--surface2)',
                border: `1px solid ${notificationEnabled ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <span
                className="absolute top-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 20, height: 20, background: '#fff', left: notificationEnabled ? 24 : 3, transition: 'left 0.3s' }}
              />
            </button>
          </div>

          {notificationEnabled && (
            <>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <span className="text-sm">Solo si no está marcado</span>
                <button
                  onClick={() => setNotifyIfNotDone(!notifyIfNotDone)}
                  className="relative transition-all duration-300"
                  style={{
                    width: 48, height: 28, borderRadius: 14,
                    background: notifyIfNotDone ? 'var(--accent)' : 'var(--surface2)',
                    border: `1px solid ${notifyIfNotDone ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <span
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: 20, height: 20, background: '#fff', left: notifyIfNotDone ? 24 : 3, transition: 'left 0.3s' }}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl text-base font-semibold transition-all active:scale-95"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            opacity: saving || !name.trim() ? 0.6 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
