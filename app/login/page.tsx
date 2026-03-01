'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (error === 'unauthorized') {
      setErrorMsg('Este email no tiene acceso a la app.')
    } else if (error === 'invalid_link') {
      setErrorMsg('El link expiró o es inválido. Pedí uno nuevo.')
    }
  }, [error])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMsg('Error al enviar el link. Revisá el email.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo / título */}
        <div className="text-center flex flex-col gap-1">
          <span className="text-4xl">✦</span>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Hábitos
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Acceso privado
          </p>
        </div>

        {sent ? (
          /* Estado: link enviado */
          <div
            className="rounded-2xl p-6 text-center flex flex-col gap-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-3xl">📬</span>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              Revisá tu email
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Te mandamos un link a{' '}
              <span style={{ color: 'var(--accent)' }}>{email}</span>.
              <br />
              Abrilo desde este dispositivo.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-xs mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Usar otro email
            </button>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full rounded-xl px-4 py-3 text-base outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />

            {errorMsg && (
              <p className="text-xs text-center" style={{ color: 'var(--red)' }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl text-base font-semibold transition-all active:scale-95"
              style={{
                background: loading || !email ? 'var(--surface)' : 'var(--accent)',
                color: loading || !email ? 'var(--text-muted)' : '#fff',
                border: '1px solid var(--border)',
              }}
            >
              {loading ? 'Enviando...' : 'Entrar con Magic Link'}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Sin contraseña. Te mandamos un link al email.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
