import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Esta ruta recibe el magic link de Supabase y convierte el code/token en sesión.
// Soporta dos flujos:
//  1. PKCE: parámetro "code" → exchangeCodeForSession (cuando el usuario abre en el mismo browser)
//  2. Token hash: parámetros "token_hash" + "type" → verifyOtp (abre en browser diferente / app de email iOS)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | null

  const supabaseResponse = NextResponse.redirect(`${origin}/hoy`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Flujo 1: token_hash (iOS email clients, browsers distintos al que solicitó el link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return supabaseResponse
  }

  // Flujo 2: code PKCE (mismo browser que solicitó el link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return supabaseResponse
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`)
}
