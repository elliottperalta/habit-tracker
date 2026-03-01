/**
 * Solicita permiso y registra la suscripción push del usuario
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push no soportado en este browser')
      return false
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Pasamos la clave como string directamente — Web Push API la acepta
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    // Enviar suscripción al servidor
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
    })

    return res.ok
  } catch (err) {
    console.error('Error subscribing to push:', err)
    return false
  }
}
