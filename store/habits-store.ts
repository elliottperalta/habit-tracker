import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Habit, HabitLog } from '@/types'
import { todayISO } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface HabitsState {
  habits: Habit[]
  logs: HabitLog[]
  loading: boolean
  userId: string | null

  // Actions
  setUserId: (id: string) => void
  fetchHabits: () => Promise<void>
  fetchLogs: (daysBack?: number) => Promise<void>

  // Logging
  logCheck: (habitId: string, done: boolean) => Promise<void>
  logMinutes: (habitId: string, minutes: number) => Promise<void>
  logSleep: (habitId: string, hours: number, quality: number) => Promise<void>
  logCounter: (habitId: string) => Promise<void>

  // CRUD hábitos
  createHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => Promise<void>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  archiveHabit: (id: string) => Promise<void>
  reorderHabits: (habits: Habit[]) => Promise<void>

  // Computed helpers
  getTodayLog: (habitId: string) => HabitLog | null
  getLogsForHabit: (habitId: string) => HabitLog[]
  getWeekLogs: (habitId: string) => HabitLog[]
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      loading: false,
      userId: null,

      setUserId: (id) => set({ userId: id }),

      fetchHabits: async () => {
        const { userId } = get()
        if (!userId) return
        set({ loading: true })
        const { data } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .eq('archived', false)
          .order('position')
        if (data) set({ habits: data as Habit[] })
        set({ loading: false })
      },

      fetchLogs: async (daysBack = 30) => {
        const { userId } = get()
        if (!userId) return
        const from = new Date()
        from.setDate(from.getDate() - daysBack)
        const { data } = await supabase
          .from('habit_logs')
          .select('*')
          .gte('date', from.toISOString().split('T')[0])
          .order('date', { ascending: false })
        if (data) set({ logs: data as HabitLog[] })
      },

      logCheck: async (habitId, done) => {
        const today = todayISO()
        const existing = get().getTodayLog(habitId)

        if (done && !existing) {
          const { data } = await supabase
            .from('habit_logs')
            .insert({ habit_id: habitId, date: today, value: 1 })
            .select()
            .single()
          if (data) set((s) => ({ logs: [data as HabitLog, ...s.logs] }))
        } else if (!done && existing) {
          await supabase.from('habit_logs').delete().eq('id', existing.id)
          set((s) => ({ logs: s.logs.filter((l) => l.id !== existing.id) }))
        }
      },

      logMinutes: async (habitId, minutes) => {
        const today = todayISO()
        const existing = get().getTodayLog(habitId)

        if (existing) {
          const newValue = existing.value + minutes
          const { data } = await supabase
            .from('habit_logs')
            .update({ value: newValue })
            .eq('id', existing.id)
            .select()
            .single()
          if (data)
            set((s) => ({
              logs: s.logs.map((l) => (l.id === existing.id ? (data as HabitLog) : l)),
            }))
        } else {
          const { data } = await supabase
            .from('habit_logs')
            .insert({ habit_id: habitId, date: today, value: minutes })
            .select()
            .single()
          if (data) set((s) => ({ logs: [data as HabitLog, ...s.logs] }))
        }
      },

      logSleep: async (habitId, hours, quality) => {
        const today = todayISO()
        const existing = get().getTodayLog(habitId)

        if (existing) {
          const { data } = await supabase
            .from('habit_logs')
            .update({ value: hours, quality })
            .eq('id', existing.id)
            .select()
            .single()
          if (data)
            set((s) => ({
              logs: s.logs.map((l) => (l.id === existing.id ? (data as HabitLog) : l)),
            }))
        } else {
          const { data } = await supabase
            .from('habit_logs')
            .insert({ habit_id: habitId, date: today, value: hours, quality })
            .select()
            .single()
          if (data) set((s) => ({ logs: [data as HabitLog, ...s.logs] }))
        }
      },

      logCounter: async (habitId) => {
        const today = todayISO()
        const existing = get().getTodayLog(habitId)

        if (!existing) {
          const { data } = await supabase
            .from('habit_logs')
            .insert({ habit_id: habitId, date: today, value: 1 })
            .select()
            .single()
          if (data) set((s) => ({ logs: [data as HabitLog, ...s.logs] }))
        }
      },

      createHabit: async (habit) => {
        const { data } = await supabase
          .from('habits')
          .insert(habit)
          .select()
          .single()
        if (data) set((s) => ({ habits: [...s.habits, data as Habit] }))
      },

      updateHabit: async (id, updates) => {
        const { data } = await supabase
          .from('habits')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (data)
          set((s) => ({
            habits: s.habits.map((h) => (h.id === id ? (data as Habit) : h)),
          }))
      },

      archiveHabit: async (id) => {
        await supabase.from('habits').update({ archived: true }).eq('id', id)
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
      },

      reorderHabits: async (habits) => {
        set({ habits })
        const updates = habits.map((h, i) =>
          supabase.from('habits').update({ position: i }).eq('id', h.id)
        )
        await Promise.all(updates)
      },

      getTodayLog: (habitId) => {
        const today = todayISO()
        return get().logs.find((l) => l.habit_id === habitId && l.date === today) ?? null
      },

      getLogsForHabit: (habitId) => {
        return get().logs.filter((l) => l.habit_id === habitId)
      },

      getWeekLogs: (habitId) => {
        const today = new Date()
        const day = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - ((day + 6) % 7))
        monday.setHours(0, 0, 0, 0)

        return get().logs.filter((l) => {
          if (l.habit_id !== habitId) return false
          const d = new Date(l.date + 'T00:00:00')
          return d >= monday
        })
      },
    }),
    {
      name: 'habits-storage',
      partialize: (state) => ({
        userId: state.userId,
        habits: state.habits,
        logs: state.logs,
      }),
    }
  )
)
