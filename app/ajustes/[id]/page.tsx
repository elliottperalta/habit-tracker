'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHabitsStore } from '@/store/habits-store'

const EMOJI_OPTIONS = [
  '💊','🏋️','😴','📖','🧘','🚶','🍎','💧','☕','🎯',
  '✍️','🎸','💻','🧹','💰','🧠','🏃','🥗','🌿','⚡',
  '📌','❤️','🌅','🎨','🎤','🐾','🧪','📐','🔑','🌟',
]

export default function EditarHabitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { habits, updateHabit, fetchHabits, loading } = useHabitsStore()
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📌')
  const [weeklyGoal, setWeeklyGoal] = useState(7)
  const [notificationEnabled, setNotificationEnabled] = useState(false)

  useEffect(() => {
    if (habits.length === 0) fetchHabits()
  }, [])

  useEffect(() => {
    const habit = habits.find((h) => h.id === id)
    if (habit && !initialized) {
      setName(habit.name)
      setIcon(habit.icon ?? '📌')
      setWeeklyGoal(habit.weekly_goal)
      setNotificationEnabled(habit.notification_enabled)
      setInitialized(true)
    }
  }, [habits, id, initialized])

  const habit = habits.find((h) => h.id === id)

  if (!initialized && (loading || habits.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span style={{ color: 'var(--text-muted)' }}>Hábito no encontrado</span>
        <button onClick={() => router.push('/ajustes')} className="text-sm" style={{ color: 'var(--accent)' }}>
          Volver a Ajustes
        </button>
      </div>
    )
  }

  async function handleSave() {
    setSaving(true)
    await updateHabit(id, {
      name: name.trim(),
      icon,
      weekly_goal: weeklyGoal,
      notification_enabled: notificationEnabled,
      notification_time: null,
      notify_if_not_done: true,
    })
    setSaving(false)
    router.push('/ajustes')
  }

  const isSleep = habit.type === 'sleep'
  const isMinutes = habit.type === 'minutes'

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pt-6" style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ← Volver
          </button>
          <h1 className="text-lg font-bold flex-1">Editar hábito</h1>
        </div>

        {/* Nombre + emoji */}
        <div className="flex flex-col gap-2">
          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Nombre</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-14 h-12 text-center text-xl rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface2)', border: `1px solid ${showEmojiPicker ? 'var(--accent)' : 'var(--border)'}` }}>
              {icon}
            </button>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl px-4 py-3 outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          {showEmojiPicker && (
            <div className="grid gap-2 p-3 rounded-xl" style={{ gridTemplateColumns: 'repeat(6, 1fr)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => { setIcon(e); setShowEmojiPicker(false) }}
                  className="text-2xl h-10 flex items-center justify-center rounded-lg"
                  style={{ background: icon === e ? '#1d4ed822' : 'transparent', border: `1px solid ${icon === e ? 'var(--accent)' : 'transparent'}` }}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meta — no aplica para sleep */}
        {!isSleep && (
          <div className="flex flex-col gap-2">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Meta ({isMinutes ? 'min/semana' : 'veces/semana'})
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - (isMinutes ? 15 : 1)))}
                className="w-12 h-12 rounded-full text-xl font-bold flex-shrink-0"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>−</button>
              <input type="number" inputMode="numeric" value={weeklyGoal}
                onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setWeeklyGoal(v) }}
                className="text-4xl font-bold text-center tabular-nums rounded-xl py-2 outline-none"
                style={{ width: 0, flexGrow: 1, minWidth: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <button onClick={() => setWeeklyGoal(weeklyGoal + (isMinutes ? 15 : 1))}
                className="w-12 h-12 rounded-full text-xl font-bold flex-shrink-0"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>+</button>
            </div>
          </div>
        )}
        {isSleep && (
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>😴 Meta fija: <span style={{ color: 'var(--text)' }}>8 horas / día</span></p>
          </div>
        )}

        {/* Notificaciones */}
        <div className="flex flex-col gap-3">
          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Notificación inteligente</label>
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--surface)', border: `1px solid ${notificationEnabled ? 'var(--accent)' : 'var(--border)'}` }}>
            <span className="text-sm">Activar notificación</span>
            <button onClick={() => setNotificationEnabled(!notificationEnabled)}
              className="relative transition-all duration-300"
              style={{ width: 48, height: 28, borderRadius: 14, background: notificationEnabled ? 'var(--accent)' : 'var(--surface2)', border: `1px solid ${notificationEnabled ? 'var(--accent)' : 'var(--border)'}` }}>
              <span className="absolute top-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 20, height: 20, background: '#fff', left: notificationEnabled ? 24 : 3, transition: 'left 0.3s' }} />
            </button>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>¿Cuándo te avisamos?</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {habit.type === 'check' && '📅 Cada día a las 20:00 si no lo has marcado'}
              {habit.type === 'minutes' && '📅 Miércoles si llevas 0 min · Viernes si vas por debajo del 50% de la meta'}
              {habit.type === 'counter' && '📅 Viernes si te faltan sesiones para cerrar la semana'}
              {habit.type === 'sleep' && '📅 Si duermes menos de 6h tres días seguidos'}
            </p>
          </div>
        </div>
      </div>

      {/* Botón fijo */}
      <div className="fixed left-0 right-0 px-4 max-w-lg mx-auto"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)' }}>
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl text-base font-semibold transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: '#fff', opacity: saving || !name.trim() ? 0.6 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )
}
