import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase/server'

// Esta ruta es llamada por el cron job de Supabase
// Requiere Authorization: Bearer CRON_SECRET
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Inicializar VAPID dentro del handler para evitar errores en build
  webpush.setVapidDetails(
    'mailto:' + process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  try {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const today = now.toISOString().split('T')[0]

    // 1. Traer todos los hábitos con notificación activa a esta hora
    const { data: habits } = await supabaseAdmin
      .from('habits')
      .select('id, name, user_id, notification_time, notify_if_not_done, icon')
      .eq('notification_enabled', true)
      .eq('notification_time', currentTime)
      .eq('archived', false)

    if (!habits || habits.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    let sent = 0

    for (const habit of habits) {
      // 2. Si notify_if_not_done, verificar que no haya log de hoy
      if (habit.notify_if_not_done) {
        const { data: log } = await supabaseAdmin
          .from('habit_logs')
          .select('id')
          .eq('habit_id', habit.id)
          .eq('date', today)
          .maybeSingle()

        if (log) continue // Ya registrado, no notificar
      }

      // 3. Traer la suscripción del usuario
      const { data: subRow } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', habit.user_id)
        .maybeSingle()

      if (!subRow?.subscription) continue

      // 4. Enviar push
      try {
        await webpush.sendNotification(
          subRow.subscription as webpush.PushSubscription,
          JSON.stringify({
            title: `${habit.icon ?? ''} ${habit.name}`,
            body: getNotificationBody(habit.name),
            url: '/hoy',
          })
        )
        sent++
      } catch (pushError) {
        // Suscripción inválida — eliminar
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('user_id', habit.user_id)
      }
    }

    return NextResponse.json({ sent })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function getNotificationBody(habitName: string): string {
  const messages: Record<string, string> = {
    Creatina: 'Son las 8pm. Disciplina acumulada o se reinicia?',
    Entreno: 'No olvidés pasar por el gym hoy.',
    Lectura: 'Algunos minutos de lectura antes de dormir?',
    Inglés: 'Un poco de inglés hoy?',
  }
  return messages[habitName] ?? `¿Ya registraste ${habitName}?`
}
