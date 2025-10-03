"use client"
import {useState} from "react"
import {supabase} from "@/lib/supabase"
import {useRouter} from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const router = useRouter()

    async function signIn() {
        await supabase.auth.signInWithOtp({email, options: {emailRedirectTo: location.origin}})
        alert("Check your email for the magic link.")
    }

    async function createProfile() {
        const {data: {user}} = await supabase.auth.getUser()
        if (!user) return
        await supabase.from("profiles").upsert({id: user.id, display_name: name})
        router.push("/households")
    }

    return (
        <main className="mx-auto max-w-sm p-6 space-y-4">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <input className="border rounded px-3 py-2 w-full" placeholder="email@you.com"
                   value={email} onChange={e => setEmail(e.target.value)}/>
            <button onClick={signIn} className="border rounded px-4 py-2 w-full">Send magic link
            </button>
            <hr/>
            <input className="border rounded px-3 py-2 w-full" placeholder="Display name"
                   value={name} onChange={e => setName(e.target.value)}/>
            <button onClick={createProfile} className="border rounded px-4 py-2 w-full">Save
                profile
            </button>
        </main>
    )
}