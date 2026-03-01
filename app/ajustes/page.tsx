'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useHabitsStore } from '@/store/habits-store'
import { Habit } from '@/types'
import { MAX_ACTIVE_HABITS } from '@/lib/constants'
import { subscribeToPush } from '@/lib/notifications'

export default function AjustesPage() {
  const router = useRouter()
  const { habits, fetchHabits, archiveHabit, updateHabit } = useHabitsStore()
  const [archiving, setArchiving] = useState<string | null>(null)

  useEffect(() => {
    fetchHabits()
  }, [])

  async function handleArchive(id: string) {
    setArchiving(id)
    await archiveHabit(id)
    setArchiving(null)
  }

  const canAdd = habits.length < MAX_ACTIVE_HABITS

  return (
    <div className="flex flex-col gap-4 px-4 pt-10 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Ajustes
        </h1>
        {canAdd ? (
          <Link
            href="/ajustes/nuevo"
            className="text-sm px-4 py-2 rounded-xl font-medium transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            + Nuevo
          </Link>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Máx. {MAX_ACTIVE_HABITS} hábitos
          </span>
        )}
      </div>

      {/* Contador */}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {habits.length}/{MAX_ACTIVE_HABITS} hábitos activos
      </p>

      {/* Lista de hábitos */}
      <div className="flex flex-col gap-2">
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            onArchive={() => handleArchive(habit.id)}
            archiving={archiving === habit.id}
            onToggleNotification={(enabled) =>
              updateHabit(habit.id, { notification_enabled: enabled })
            }
          />
        ))}
        {habits.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p style={{ color: 'var(--text-muted)' }}>
              No hay hábitos activos.{' '}
              <Link href="/ajustes/nuevo" style={{ color: 'var(--accent)' }}>
                Crear uno
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Notificaciones push */}
      <PushSection />

      {/* Logout */}
      <LogoutButton router={router} />
    </div>
  )
}

// ----- Logout -----
function LogoutButton({ router }: { router: ReturnType<typeof useRouter> }) {
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm transition-all active:scale-95"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? 'Cerrando...' : '→ Cerrar sesión'}
    </button>
  )
}

// ----- Fila de hábito -----
function HabitRow({
  habit,
  onArchive,
  archiving,
  onToggleNotification,
}: {
  habit: Habit
  onArchive: () => void
  archiving: boolean
  onToggleNotification: (enabled: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Cabecera */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <span>{habit.icon ?? '📌'}</span>
          <span className="font-medium text-sm">{habit.name}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
          >
            {habit.type === 'sleep'
              ? 'Sueño'
              : habit.type === 'check'
              ? 'Check'
              : habit.type === 'counter'
              ? 'Contador'
              : 'Minutos'}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Opciones expandidas */}
      {expanded && (
        <div
          className="px-4 pb-4 flex flex-col gap-3 pt-1"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Meta */}
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Meta semanal</span>
            <span className="font-medium">
              {habit.weekly_goal}{' '}
              {habit.type === 'minutes' ? 'min' : habit.type === 'counter' ? 'veces' : 'días'}
            </span>
          </div>

          {/* Notificación */}
          {habit.type !== 'sleep' && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span style={{ color: 'var(--text-muted)' }}>Notificación</span>
                {habit.notification_enabled && habit.notification_time && (
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>
                    {habit.notification_time} · Solo si no marcado
                  </span>
                )}
              </div>
              <button
                onClick={() => onToggleNotification(!habit.notification_enabled)}
                className="relative transition-all duration-300"
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  background: habit.notification_enabled ? 'var(--accent)' : 'var(--surface2)',
                  border: `1px solid ${habit.notification_enabled ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <span
                  className="absolute top-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    background: '#fff',
                    left: habit.notification_enabled ? 24 : 3,
                    transition: 'left 0.3s',
                  }}
                />
              </button>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <Link
              href={`/ajustes/${habit.id}`}
              className="flex-1 text-center text-xs py-2 rounded-xl transition-all"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              ✏️ Editar
            </Link>
            <button
              onClick={onArchive}
              disabled={archiving}
              className="flex-1 text-xs py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--red)',
                opacity: archiving ? 0.5 : 1,
              }}
            >
              {archiving ? '...' : '🗄 Archivar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ----- Sección push -----
function PushSection() {
  const { userId } = useHabitsStore()
  const [status, setStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) {
      setStatus('unsupported')
    } else {
      setStatus(Notification.permission as 'granted' | 'denied' | 'unknown')
    }
  }, [])

  async function requestPermission() {
    if (!userId) return
    setSubscribing(true)
    const ok = await subscribeToPush(userId)
    setStatus(ok ? 'granted' : 'denied')
    setSubscribing(false)
  }

  if (status === 'unsupported') return null

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold">🔔 Notificaciones push</p>
      {status === 'granted' ? (
        <p className="text-xs" style={{ color: 'var(--green)' }}>
          ✓ Activadas · Los hábitos con notificación te avisarán a la hora configurada
        </p>
      ) : status === 'denied' ? (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          Bloqueadas · Actívalas en Ajustes › Safari › Notificaciones
        </p>
      ) : (
        <>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Activa las notificaciones para recibir recordatorios. La app debe estar instalada en
            tu pantalla de inicio (iOS 16.4+).
          </p>
          <button
            onClick={requestPermission}
            disabled={subscribing}
            className="py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: '#fff', opacity: subscribing ? 0.6 : 1 }}
          >
            {subscribing ? 'Activando...' : 'Activar notificaciones'}
          </button>
        </>
      )}
    </div>
  )
}
