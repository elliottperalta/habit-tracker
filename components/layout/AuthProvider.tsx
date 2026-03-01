'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useHabitsStore } from '@/store/habits-store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUserId, fetchHabits, fetchLogs } = useHabitsStore()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchHabits()
        fetchLogs(60)
      }
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        fetchHabits()
        fetchLogs(60)
      } else {
        setUserId('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
