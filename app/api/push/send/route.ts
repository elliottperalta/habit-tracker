import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * NOTIFICACIONES INTELIGENTES — Principio: notificar por riesgo, no por hábito.
 *
 * Reglas por tipo:
 *  check   → diaria a las 20:00 si no está marcada (ej. creatina)
 *  minutes → miércoles si progress=0, viernes si progress < 50% meta
 *  counter → viernes si faltan sesiones para cerrar la semana
 *  sleep   → cualquier día si los últimos 3 días consecutivos < 6h
 *
 * Máximo: 1 notificación estratégica/semana por hábito (excepto check que es diaria)
 */

// ─── Helpers de fecha ──────────────────────────────────────────────────────────

/** Panamá es UTC-5 y no tiene horario de verano */
const PANAMA_OFFSET_MS = -5 * 60 * 60 * 1000

/** Convierte un Date UTC al instante equivalente en hora panameña */
function toPanama(utc: Date): Date {
  return new Date(utc.getTime() + PANAMA_OFFSET_MS)
}

/** Fecha en formato YYYY-MM-DD en hora panameña */
function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

/** Inicio y fin de la semana actual (lunes–domingo) en UTC */
function getWeekBounds(now: Date): { start: string; end: string } {
  const day = now.getUTCDay() // 0=Dom
  const daysToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + daysToMonday)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: toISO(monday), end: toISO(sunday) }
}

/** Suma de 'value' en logs de la semana actual para un hábito */
async function weeklyProgress(habitId: string, weekStart: string, weekEnd: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('habit_logs')
    .select('value')
    .eq('habit_id', habitId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
  return (data ?? []).reduce((s, r) => s + (r.value ?? 0), 0)
}

/** Comprueba si los últimos N días consecutivos tienen value < threshold */
async function consecutiveDaysBelow(habitId: string, days: number, threshold: number, today: string): Promise<boolean> {
  const dates: string[] = []
  const ref = new Date(today + 'T00:00:00Z')
  for (let i = 1; i <= days; i++) {
    const d = new Date(ref)
    d.setUTCDate(ref.getUTCDate() - i)
    dates.push(toISO(d))
  }

  const { data } = await supabaseAdmin
    .from('habit_logs')
    .select('date, value')
    .eq('habit_id', habitId)
    .in('date', dates)

  // Todos los días deben tener log Y con value < threshold
  if (!data || data.length < days) return false // falta algún día → no hay datos suficientes
  return data.every(r => (r.value ?? 0) < threshold)
}

// ─── Construir payload de notificación ────────────────────────────────────────

interface NotifPayload {
  title: string
  body: string
  url: string
}

function buildCheckPayload(icon: string, name: string): NotifPayload {
  return {
    title: `${icon} ${name}`,
    body: '¿Ya lo hiciste hoy?',
    url: '/hoy',
  }
}

function buildMinutesWedPayload(icon: string, name: string): NotifPayload {
  return {
    title: `${icon} ${name}`,
    body: `Mitad de semana y aún 0 minutos. ¿10 min ahora?`,
    url: '/hoy',
  }
}

function buildMinutesFriPayload(icon: string, name: string, progress: number, goal: number): NotifPayload {
  const remaining = Math.max(0, goal - progress)
  return {
    title: `${icon} ${name}`,
    body: `Te quedan ${remaining} min para cerrar la meta semanal.`,
    url: '/hoy',
  }
}

function buildCounterFriPayload(icon: string, name: string, progress: number, goal: number): NotifPayload {
  const remaining = goal - progress
  return {
    title: `${icon} ${name}`,
    body: remaining === 1
      ? `Te falta 1 sesión para cerrar la semana.`
      : `Te faltan ${remaining} sesiones para cerrar la semana.`,
    url: '/hoy',
  }
}

function buildSleepAwarenessPayload(icon: string, name: string): NotifPayload {
  return {
    title: `${icon} ${name}`,
    body: 'Tu promedio de sueño está bajo esta semana. Intenta acostarte antes.',
    url: '/hoy',
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

async function runNotifications(): Promise<NextResponse> {

  webpush.setVapidDetails(
    'mailto:' + process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  try {
    const nowUTC = new Date()
    const now = toPanama(nowUTC)          // hora local Panamá
    const today = toISO(now)             // fecha en Panamá
    const dayOfWeek = now.getUTCDay()    // 0=Dom … 6=Sáb, en hora panameña
    const isWednesday = dayOfWeek === 3
    const isFriday = dayOfWeek === 5
    const { start: weekStart, end: weekEnd } = getWeekBounds(now)

    // Traer todos los hábitos activos con notificación habilitada
    const { data: habits } = await supabaseAdmin
      .from('habits')
      .select('id, name, icon, type, weekly_goal, user_id, notify_if_not_done, notification_time')
      .eq('notification_enabled', true)
      .eq('archived', false)

    if (!habits || habits.length === 0) return NextResponse.json({ sent: 0, debug: 'no habits' })

    // Hora actual en Panamá (HH) para filtrar por notification_time
    const currentHour = now.getHours() // 0-23 en hora panameña

    // Solo hábitos cuya notification_time coincide con la hora actual del llamado
    // Si un hábito no tiene notification_time, se usa la lógica inteligente original (sin filtro de hora)
    const habitsToProcess = habits.filter((h) => {
      if (!h.notification_time) return true // sin hora configurada → siempre elegible
      const [hh] = (h.notification_time as string).split(':').map(Number)
      return hh === currentHour
    })

    // Caché de suscripciones por user_id para no repetir consultas
    const subCache: Record<string, webpush.PushSubscription | null> = {}

    async function getSubscription(userId: string): Promise<webpush.PushSubscription | null> {
      if (userId in subCache) return subCache[userId]
      const { data } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .maybeSingle()
      subCache[userId] = (data?.subscription as webpush.PushSubscription) ?? null
      return subCache[userId]
    }

    async function sendPush(userId: string, payload: NotifPayload): Promise<boolean> {
      const sub = await getSubscription(userId)
      if (!sub) return false
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload))
        return true
      } catch {
        // Suscripción caducada — limpiar
        await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId)
        return false
      }
    }

    let sent = 0
    const log: string[] = []

    for (const habit of habitsToProcess) {
      const icon = habit.icon ?? ''
      let payload: NotifPayload | null = null

      // ── CHECK: diaria, solo si no está marcada hoy ────────────────────────
      if (habit.type === 'check') {
        if (habit.notify_if_not_done) {
          const { data: todayLog } = await supabaseAdmin
            .from('habit_logs')
            .select('id')
            .eq('habit_id', habit.id)
            .eq('date', today)
            .maybeSingle()
          if (!todayLog) {
            payload = buildCheckPayload(icon, habit.name)
          }
        } else {
          payload = buildCheckPayload(icon, habit.name)
        }
      }

      // ── MINUTES: miércoles si 0, viernes si < 50% ─────────────────────────
      else if (habit.type === 'minutes') {
        const progress = await weeklyProgress(habit.id, weekStart, weekEnd)
        if (isWednesday && progress === 0) {
          payload = buildMinutesWedPayload(icon, habit.name)
        } else if (isFriday && progress < habit.weekly_goal * 0.5) {
          payload = buildMinutesFriPayload(icon, habit.name, progress, habit.weekly_goal)
        }
      }

      // ── COUNTER: viernes si faltan sesiones ───────────────────────────────
      else if (habit.type === 'counter') {
        if (isFriday) {
          const progress = await weeklyProgress(habit.id, weekStart, weekEnd)
          if (progress < habit.weekly_goal) {
            payload = buildCounterFriPayload(icon, habit.name, progress, habit.weekly_goal)
          }
        }
      }

      // ── SLEEP: awareness si 3 días consecutivos < 6h ─────────────────────
      else if (habit.type === 'sleep') {
        const below = await consecutiveDaysBelow(habit.id, 3, 6, today)
        if (below) {
          payload = buildSleepAwarenessPayload(icon, habit.name)
        }
      }

      if (payload) {
        const ok = await sendPush(habit.user_id, payload)
        if (ok) {
          sent++
          log.push(`[OK] ${habit.name} → ${payload.body}`)
        }
      }
    }

    return NextResponse.json({ sent, log })
  } catch (e) {
    console.error('[push/send]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Vercel cron jobs send GET requests — this is the actual cron entry point
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runNotifications()
}

// Keep POST for manual triggers / testing
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runNotifications()
}
