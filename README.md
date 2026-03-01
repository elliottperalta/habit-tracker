# Hábitos — Tracker minimalista

PWA de hábitos oscura y minimalista con notificaciones push para iPhone.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** — diseño oscuro
- **Zustand** — estado global persistente
- **Supabase** — base de datos + auth
- **Web Push API** — notificaciones push (iOS 16.4+)

## Setup

### 1. Variables de entorno
Completar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
CRON_SECRET=
```

### 2. Base de datos
Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase.

### 3. Dev
```bash
npm run dev
```

## Pantallas

| Ruta | Pantalla |
|------|----------|
| `/hoy` | 5 bloques: Sueño, Creatina, Entreno, Lectura, Inglés |
| `/progreso` | Estadísticas semanales por hábito |
| `/ajustes` | CRUD hábitos + notificaciones push |

## Notificaciones push en iPhone

1. Safari iOS 16.4+ → Compartir → "Añadir a pantalla inicio"
2. Abrir desde el ícono → Ajustes → Activar notificaciones

## Cron job (Supabase)
Llamar `POST /api/push/send` cada minuto con `Authorization: Bearer CRON_SECRET`.
