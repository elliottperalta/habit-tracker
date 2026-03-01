export type HabitType = 'check' | 'minutes' | 'sleep' | 'counter'

export type RecurrenceType = 'daily' | 'specific' | 'times_per_week'

export interface Recurrence {
  type: RecurrenceType
  days?: number[] // 0=Dom, 1=Lun, ... 6=Sab (para 'specific')
  timesPerWeek?: number // para 'times_per_week'
}

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  weekly_goal: number // minutos o veces
  recurrence: Recurrence
  notification_enabled: boolean
  notification_time: string | null // "20:00"
  notify_if_not_done: boolean
  position: number
  archived: boolean
  created_at: string
  icon?: string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string // "YYYY-MM-DD"
  value: number // 1 para check, minutos, horas (sleep)
  quality?: number // 1-5 solo para sueño
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  subscription: PushSubscriptionJSON
  created_at: string
}

// Estado calculado de un hábito para hoy
export interface HabitTodayState {
  habit: Habit
  todayLog: HabitLog | null
  streak: number
  weeklyProgress: number // acumulado semana actual
}

// Estado de semana para pantalla Progreso
export interface WeekSummary {
  status: 'solid' | 'irregular' | 'low'
  label: string
  message: string
}

export interface StreakStatus {
  emoji: string
  text: string
}

// Hábitos por defecto al crear cuenta
export const DEFAULT_HABITS: Omit<Habit, 'id' | 'user_id' | 'created_at'>[] = [
  {
    name: 'Sueño',
    type: 'sleep',
    weekly_goal: 7,
    recurrence: { type: 'daily' },
    notification_enabled: false,
    notification_time: null,
    notify_if_not_done: false,
    position: 0,
    archived: false,
    icon: '💤',
  },
  {
    name: 'Creatina',
    type: 'check',
    weekly_goal: 7,
    recurrence: { type: 'daily' },
    notification_enabled: true,
    notification_time: '20:00',
    notify_if_not_done: true,
    position: 1,
    archived: false,
    icon: '💊',
  },
  {
    name: 'Entreno',
    type: 'counter',
    weekly_goal: 3,
    recurrence: { type: 'times_per_week', timesPerWeek: 3 },
    notification_enabled: false,
    notification_time: null,
    notify_if_not_done: false,
    position: 2,
    archived: false,
    icon: '🏋️',
  },
  {
    name: 'Lectura',
    type: 'minutes',
    weekly_goal: 60,
    recurrence: { type: 'daily' },
    notification_enabled: false,
    notification_time: null,
    notify_if_not_done: false,
    position: 3,
    archived: false,
    icon: '📖',
  },
  {
    name: 'Inglés',
    type: 'minutes',
    weekly_goal: 60,
    recurrence: { type: 'daily' },
    notification_enabled: false,
    notification_time: null,
    notify_if_not_done: false,
    position: 4,
    archived: false,
    icon: '🇺🇸',
  },
]
