import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json()

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Upsert: si ya existe para este usuario, actualiza
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({ user_id: userId, subscription }, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
