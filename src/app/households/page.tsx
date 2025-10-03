"use client"
import {useEffect, useState} from "react"
import Link from "next/link"
import {supabase} from "@/lib/supabase"
import type {Household} from "@/types/db"

export default function HouseholdsPage() {
    const [households, setHouseholds] = useState<Household[]>([])
    const [name, setName] = useState("")

    useEffect(() => {
        ;(async () => {
            const {data, error} = await supabase
                .from("households")
                .select("*")
                .order("created_at", {ascending: true})
            if (!error && data) setHouseholds(data as Household[])
        })()
    }, [])

    async function createHousehold() {
        if (!name.trim()) return
        const invite_code = Math.random().toString(36).slice(2, 8).toUpperCase()
        const {data: {user}} = await supabase.auth.getUser()
        if (!user) return
        const {error} = await supabase.from("households").insert({
            name, invite_code, owner_id: user.id
        })
        if (error) return
        setName("")
        const {data} = await supabase.from("households").select("*")
        setHouseholds((data ?? []) as Household[])
    }

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <h2 className="text-xl font-semibold">Your households</h2>

            <div className="flex gap-2">
                <input
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Household name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <button onClick={createHousehold} className="border rounded px-4">
                    Create
                </button>
            </div>

            <ul className="space-y-2">
                {households.map(h => (
                    <li key={h.id} className="border rounded p-3 flex items-center justify-between">
                        <div>
                            <div className="font-medium">{h.name}</div>
                            <div className="text-xs opacity-70">Invite code: {h.invite_code}</div>
                        </div>
                        <Link href={`/households/${h.id}`} className="underline">Open</Link>
                    </li>
                ))}
            </ul>
        </main>
    )
}