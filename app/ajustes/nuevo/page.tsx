'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHabitsStore } from '@/store/habits-store'
import { HabitType, RecurrenceType } from '@/types'
import { supabase } from '@/lib/supabase/client'

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const EMOJI_OPTIONS = [
  '💊','🏋️','😴','📖','🧘','🚶','🍎','💧','☕','🎯',
  '✍️','🎸','💻','🧹','💰','🧠','🏃','🥗','🌿','⚡',
  '📌','❤️','🌅','🎨','🎤','🐾','🧪','📐','🔑','🌟',
]

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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // sleep→2 pasos, counter/minutes→3 pasos (sin recurrencia), check→4 pasos
  const totalSteps = type === 'sleep' ? 2 : (type === 'counter' || type === 'minutes') ? 3 : 4

  // Paso visual
  const displayStep =
    type === 'sleep' && step === 4 ? 2
    : (type === 'counter' || type === 'minutes') && step === 4 ? 3
    : step

  function goNext() {
    if (type === 'sleep' && step === 1) {
      setStep(4) // sleep: saltar meta + recurrencia
    } else if ((type === 'counter' || type === 'minutes') && step === 2) {
      setStep(4) // counter/minutes: saltar recurrencia
    } else {
      setStep(step + 1)
    }
  }

  function goBack() {
    if (step <= 1) { router.back(); return }
    if (type === 'sleep' && step === 4) {
      setStep(1) // sleep: volver al inicio
    } else if ((type === 'counter' || type === 'minutes') && step === 4) {
      setStep(2) // volver saltando recurrencia
    } else {
      setStep(step - 1)
    }
  }

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    setSaveError('')

    // Obtener userId directamente de Supabase Auth como fuente fiable
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaveError('Sin sesión activa. Cierra sesión y vuelve a entrar.')
      setSaving(false)
      return
    }

    // Para sleep y minutes la recurrencia es diaria (sin paso de selección)
    const finalRecurrence =
      type === 'counter'
        ? { type: 'times_per_week' as const, timesPerWeek: weeklyGoal }
        : type === 'sleep' || type === 'minutes'
        ? { type: 'daily' as const }
        : {
            type: recurrence,
            days: recurrence === 'specific' ? specificDays : undefined,
            timesPerWeek: recurrence === 'times_per_week' ? timesPerWeek : undefined,
          }

    try {
      await createHabit({
        user_id: user.id,
        name: name.trim(),
        icon,
        type,
        weekly_goal: weeklyGoal,
        recurrence: finalRecurrence,
        notification_enabled: notificationEnabled,
        notification_time: notificationEnabled ? notificationTime : null,
        notify_if_not_done: true,
        position: habits.length,
        archived: false,
      })
      router.push('/ajustes')
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Contenido scrollable con espacio para el botón fijo */}
      <div className="flex flex-col gap-6 px-4 pt-6" style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom))' }}>
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
            {/* Botón emoji — abre selector */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-14 h-12 text-center text-xl rounded-xl flex items-center justify-center transition-all"
              style={{
                background: 'var(--surface2)',
                border: `1px solid ${showEmojiPicker ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {icon}
            </button>
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

          {/* Grid de emojis */}
          {showEmojiPicker && (
            <div
              className="grid gap-2 p-3 rounded-xl"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)', background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setIcon(e); setShowEmojiPicker(false) }}
                  className="text-2xl h-10 flex items-center justify-center rounded-lg transition-all active:scale-90"
                  style={{ background: icon === e ? '#1d4ed822' : 'transparent', border: `1px solid ${icon === e ? 'var(--accent)' : 'transparent'}` }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm font-semibold">¿Qué tipo de hábito es?</p>
          <div className="flex flex-col gap-2">
            {(
              [
                { value: 'check', label: '✅ Check — Se hace o no se hace', desc: 'Creatina, Meditación' },
                { value: 'minutes', label: '⏱️ Minutos — Acumulas tiempo', desc: 'Lectura, Inglés' },
                { value: 'counter', label: '🔢 Contador — Veces por semana', desc: 'Entreno, Yoga' },
                { value: 'sleep', label: '😴 Sueño — Horas diarias', desc: 'Meta: 8h/día + calidad' },
              ] as { value: HabitType; label: string; desc: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setType(opt.value)
                  // Reset meta a valor sensato según tipo
                  setWeeklyGoal(
                    opt.value === 'minutes' ? 60
                    : opt.value === 'counter' ? 3
                    : opt.value === 'sleep' ? 56  // 8h × 7 días
                    : 7
                  )
                }}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - (type === 'minutes' ? 15 : 1)))}
              className="w-12 h-12 rounded-full text-xl font-bold transition-all active:scale-90 flex-shrink-0"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={weeklyGoal}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v >= 1) setWeeklyGoal(type === 'minutes' ? Math.max(15, v) : Math.min(7, v))
              }}
              className="text-4xl font-bold text-center tabular-nums rounded-xl py-2 outline-none"
              style={{
                width: 0,
                flexGrow: 1,
                minWidth: 0,
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
            <button
              onClick={() => setWeeklyGoal(weeklyGoal + (type === 'minutes' ? 15 : 1))}
              className="w-12 h-12 rounded-full text-xl font-bold transition-all active:scale-90 flex-shrink-0"
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
          <p className="text-sm font-semibold">¿Quieres notificaciones inteligentes?</p>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'var(--surface)', border: `1px solid ${notificationEnabled ? 'var(--accent)' : 'var(--border)'}` }}>
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

          {/* Selector de hora */}
          {notificationEnabled && (
            <div className="flex flex-col gap-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hora de notificación</p>
              <div className="flex gap-2 flex-wrap">
                {[['07:00','7am'],['20:00','8pm'],['21:00','9pm'],['22:00','10pm']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setNotificationTime(val)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: notificationTime === val ? 'var(--accent)' : 'var(--surface2)',
                      border: `1px solid ${notificationTime === val ? 'var(--accent)' : 'var(--border)'}`,
                      color: notificationTime === val ? '#fff' : 'var(--text)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción de la regla */}
          <div className="p-4 rounded-xl flex flex-col gap-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>¿Cuándo te avisamos?</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {type === 'check' && `📅 Cada día a las ${notificationTime} si no lo has marcado`}
              {type === 'minutes' && '📅 Miércoles si llevas 0 min · Viernes si vas por debajo del 50% de la meta'}
              {type === 'counter' && '📅 Viernes si te faltan sesiones para cerrar la semana'}
              {type === 'sleep' && '📅 Si duermes menos de 6h tres días seguidos'}
            </p>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      </div>

      {/* Botón fijo sobre la BottomNav */}
      <div
        className="fixed left-0 right-0 px-4 max-w-lg mx-auto"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)' }}
      >
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
        {saveError && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--red, #ef4444)' }}>
            {saveError}
          </p>
        )}
      </div>
    </>
  )
}
