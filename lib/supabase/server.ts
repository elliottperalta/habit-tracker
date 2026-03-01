import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Solo usar del lado servidor (API routes, Edge Functions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
