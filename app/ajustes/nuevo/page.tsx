'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHabitsStore } from '@/store/habits-store'
import { HabitType, RecurrenceType } from '@/types'

const ICONS: Record<string, string> = {
  check: '✅',
  minutes: '⏱️',
  counter: '🔢',
  sleep: '💤',
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function NuevoHabitoPage() {
  const router = useRouter()
  const { createHabit, habits, userId } = useHabitsStore()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📌')
  const [type, setType] = useState<HabitType>('check')
  const [weeklyGoal, setWeeklyGoal] = useState(7)
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily')
  const [specificDays, setSpecificDays] = useState<number[]>([])
  const [timesPerWeek, setTimesPerWeek] = useState(3)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationTime, setNotificationTime] = useState('20:00')
  const [notifyIfNotDone, setNotifyIfNotDone] = useState(true)
  const [saving, setSaving] = useState(false)

  // Counter no tiene paso de recurrencia (ya está implícito en la meta semanal)
  const totalSteps = type === 'counter' ? 3 : 4

  // Paso visual (counter: 4→3 cuando llegamos al último paso)
  const displayStep = type === 'counter' && step === 4 ? 3 : step

  function goNext() {
    if (type === 'counter' && step === 2) {
      setStep(4) // saltar recurrencia
    } else {
      setStep(step + 1)
    }
  }

  function goBack() {
    if (step <= 1) { router.back(); return }
    if (type === 'counter' && step === 4) {
      setStep(2) // volver saltando recurrencia
    } else {
      setStep(step - 1)
    }
  }

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)

    // Para counter la recurrencia queda fijada como times_per_week = weekly_goal
    const finalRecurrence =
      type === 'counter'
        ? { type: 'times_per_week' as const, timesPerWeek: weeklyGoal }
        : {
            type: recurrence,
            days: recurrence === 'specific' ? specificDays : undefined,
            timesPerWeek: recurrence === 'times_per_week' ? timesPerWeek : undefined,
          }

    await createHabit({
      user_id: userId ?? '',
      name: name.trim(),
      icon,
      type,
      weekly_goal: weeklyGoal,
      recurrence: finalRecurrence,
      notification_enabled: notificationEnabled,
      notification_time: notificationEnabled ? notificationTime : null,
      notify_if_not_done: notifyIfNotDone,
      position: habits.length,
      archived: false,
    })

    setSaving(false)
    router.push('/ajustes')
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-10 pb-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Volver
        </button>
        <h1 className="text-lg font-bold flex-1">Nuevo hábito</h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {displayStep}/{totalSteps}
        </span>
      </div>

      {/* Barra de progreso */}
      <div
        className="h-1 rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(displayStep / totalSteps) * 100}%`, background: 'var(--accent)' }}
        />
      </div>

      {/* PASO 1: Nombre y tipo */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">¿Cómo se llama el hábito?</p>

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              className="w-14 text-center text-xl rounded-xl py-3 outline-none"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              placeholder="📌"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meditación..."
              className="flex-1 rounded-xl px-4 py-3 outline-none text-base"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <p className="text-sm font-semibold">¿Qué tipo de hábito es?</p>
          <div className="flex flex-col gap-2">
            {(
              [
                { value: 'check', label: '✅ Check — Se hace o no se hace', desc: 'Creatina, Meditación' },
                { value: 'minutes', label: '⏱️ Minutos — Acumulas tiempo', desc: 'Lectura, Inglés' },
                { value: 'counter', label: '🔢 Contador — Veces por semana', desc: 'Entreno, Yoga' },
              ] as { value: HabitType; label: string; desc: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className="text-left rounded-xl p-3 transition-all"
                style={{
                  background: type === opt.value ? '#1d4ed822' : 'var(--surface)',
                  border: `1px solid ${type === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: Meta */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">
            {type === 'minutes' ? '¿Cuántos minutos por semana?' : '¿Cuántas veces por semana?'}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - (type === 'minutes' ? 15 : 1)))}
              className="w-12 h-12 rounded-full text-xl font-bold transition-all active:scale-90"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              −
            </button>
            <span className="text-4xl font-bold flex-1 text-center tabular-nums">
              {weeklyGoal}
            </span>
            <button
              onClick={() => setWeeklyGoal(weeklyGoal + (type === 'minutes' ? 15 : 1))}
              className="w-12 h-12 rounded-full text-xl font-bold transition-all active:scale-90"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              +
            </button>
          </div>
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {type === 'minutes' ? `${weeklyGoal} min / semana` : `${weeklyGoal} veces / semana`}
          </p>
        </div>
      )}

      {/* PASO 3: Recurrencia */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">¿Con qué frecuencia?</p>
          {(
            [
              { value: 'daily', label: '📅 Diario' },
              { value: 'times_per_week', label: '🔄 X veces por semana' },
              { value: 'specific', label: '📌 Días específicos' },
            ] as { value: RecurrenceType; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRecurrence(opt.value)}
              className="text-left rounded-xl p-3 transition-all text-sm font-medium"
              style={{
                background: recurrence === opt.value ? '#1d4ed822' : 'var(--surface)',
                border: `1px solid ${recurrence === opt.value ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}

          {recurrence === 'times_per_week' && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTimesPerWeek(Math.max(1, timesPerWeek - 1))}
                className="w-10 h-10 rounded-full text-lg font-bold"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                −
              </button>
              <span className="text-2xl font-bold flex-1 text-center">{timesPerWeek}×</span>
              <button
                onClick={() => setTimesPerWeek(Math.min(7, timesPerWeek + 1))}
                className="w-10 h-10 rounded-full text-lg font-bold"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                +
              </button>
            </div>
          )}

          {recurrence === 'specific' && (
            <div className="flex gap-2">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setSpecificDays((prev) =>
                      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                    )
                  }
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: specificDays.includes(i) ? 'var(--accent)' : 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: specificDays.includes(i) ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PASO 4: Notificaciones */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">¿Quieres notificaciones?</p>

          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
                style={{
                  width: 20, height: 20, background: '#fff',
                  left: notificationEnabled ? 24 : 3,
                  transition: 'left 0.3s',
                }}
              />
            </button>
          </div>

          {notificationEnabled && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Hora</label>
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  className="rounded-xl px-4 py-3 text-base outline-none"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
                    style={{
                      width: 20, height: 20, background: '#fff',
                      left: notifyIfNotDone ? 24 : 3,
                      transition: 'left 0.3s',
                    }}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botones de navegación */}
      <div className="mt-auto pt-4">
        {step < 4 ? (
          <button
            onClick={goNext}
            disabled={step === 1 && !name.trim()}
            className="w-full py-3 rounded-xl text-base font-semibold transition-all active:scale-95"
            style={{
              background: step === 1 && !name.trim() ? 'var(--surface2)' : 'var(--accent)',
              color: step === 1 && !name.trim() ? 'var(--text-muted)' : '#fff',
            }}
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full py-3 rounded-xl text-base font-semibold transition-all active:scale-95"
            style={{ background: 'var(--green)', color: '#fff', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Guardando...' : 'Crear hábito ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
