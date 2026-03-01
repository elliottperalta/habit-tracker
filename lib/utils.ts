import { format, isToday, parseISO } from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isLogToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function pct(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(current / goal, 1)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
