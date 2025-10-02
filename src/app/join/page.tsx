"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Join() {
    const [code, setCode] = useState("")
    const router = useRouter()

    async function join() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { alert("Sign in first"); return }
        const { data: hh } = await supabase.from("households").select("*").eq("invite_code", code.toUpperCase()).single()
        if (!hh) { alert("Not found"); return }
        await supabase.from("household_members").upsert({ household_id: hh.id, user_id: user.id, role: 'member' })
        router.push(`/households/${hh.id}`)
    }

    return (
        <main className="mx-auto max-w-sm p-6 space-y-3">
            <h1 className="text-xl font-semibold">Join household</h1>
            <input className="border rounded px-3 py-2 w-full" placeholder="Invite code" value={code} onChange={e=>setCode(e.target.value)} />
            <button onClick={join} className="border rounded px-4 py-2 w-full">Join</button>
        </main>
    )
}