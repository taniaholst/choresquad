import {createClient} from '@supabase/supabase-js'

export function supabaseServer() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {auth: {persistSession: false}}
    )
}

// src/lib/supabase-server.ts
/*
import { createClient } from "@supabase/supabase-js"

export const supabaseServer = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )*/
