import { StreakStatus } from '@/types'

export function getCreatinaStreakStatus(streak: number): StreakStatus {
  if (streak === 0) return { emoji: '🌱', text: 'Día cero' }
  if (streak <= 2) return { emoji: '🔨', text: 'Construyendo' }
  if (streak <= 6) return { emoji: '⚡', text: 'Consistente' }
  if (streak <= 14) return { emoji: '🔥', text: 'Disciplina activa' }
  if (streak <= 29) return { emoji: '🤖', text: 'Modo automático' }
  return { emoji: '💎', text: 'Inquebrantable' }
}

export function getEntrenoWeekStatus(weekStreak: number): StreakStatus {
  if (weekStreak === 0) return { emoji: '💤', text: 'Sin semanas aún' }
  if (weekStreak === 1) return { emoji: '💪', text: 'Buena semana' }
  if (weekStreak <= 3) return { emoji: '🏃', text: 'Ritmo estable' }
  if (weekStreak <= 7) return { emoji: '🏆', text: 'Atleta consistente' }
  return { emoji: '🦾', text: 'Máquina' }
}

export function getSleepStatus(hours: number): StreakStatus {
  if (hours >= 7) return { emoji: '🟢', text: 'Sueño sólido' }
  if (hours >= 6) return { emoji: '🟡', text: 'Modo funcional' }
  return { emoji: '🔴', text: 'Deuda acumulándose' }
}

export function getMinutesProgress(current: number, goal: number): StreakStatus {
  const pct = goal > 0 ? current / goal : 0
  if (pct >= 1) return { emoji: '✅', text: 'Meta cumplida' }
  if (pct >= 0.25) return { emoji: '📈', text: 'En progreso' }
  return { emoji: '🐢', text: 'Arrancando' }
}

export function getGenericStreakStatus(streak: number, habitName: string): StreakStatus {
  // Estado genérico para cualquier hábito
  if (streak === 0) return { emoji: '🌱', text: 'Sin racha aún' }
  if (streak <= 2) return { emoji: '🔨', text: 'Construyendo' }
  if (streak <= 6) return { emoji: '⚡', text: 'Consistente' }
  if (streak <= 14) return { emoji: '🔥', text: 'En racha' }
  if (streak <= 29) return { emoji: '🤖', text: 'Modo automático' }
  return { emoji: '💎', text: 'Inquebrantable' }
}

/**
 * Calcula la racha actual de un hábito a partir de sus logs
 * (días consecutivos hacia atrás desde hoy)
 */
export function calculateStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0

  const sorted = [...logDates].sort((a, b) => b.localeCompare(a))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = new Date(today)

  for (const dateStr of sorted) {
    const logDate = new Date(dateStr + 'T00:00:00')
    const diffDays = Math.round(
      (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 0) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (diffDays === 1) {
      streak++
      currentDate = new Date(logDate)
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Calcula cuántas semanas seguidas se cumplió la meta de entreno
 */
export function calculateWeekStreak(logDates: string[], weeklyGoal: number): number {
  if (logDates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let weekOffset = 0

  while (true) {
    const { start, end } = getWeekRange(today, weekOffset)
    const count = logDates.filter((d) => {
      const date = new Date(d + 'T00:00:00')
      return date >= start && date <= end
    }).length

    if (count >= weeklyGoal) {
      streak++
      weekOffset--
    } else {
      break
    }
  }

  return streak
}

/**
 * Retorna el rango de lunes a domingo de hace N semanas
 */
export function getWeekRange(
  referenceDate: Date,
  weekOffset = 0
): { start: Date; end: Date } {
  const d = new Date(referenceDate)
  const day = d.getDay() // 0=Dom
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7) + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

/**
 * Calcula los logs de la semana actual
 */
export function getThisWeekLogs(logDates: string[]): string[] {
  const today = new Date()
  const { start, end } = getWeekRange(today)
  return logDates.filter((d) => {
    const date = new Date(d + 'T00:00:00')
    return date >= start && date <= end
  })
}
