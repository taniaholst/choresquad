"use client"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { addDays, set } from "date-fns"
import { RRule, RRuleSet, Weekday } from "rrule"

type Profile = { id: string; display_name: string; emoji: string|null }
const WDAY: Record<number, Weekday> = {
    0: RRule.MO, 1: RRule.TU, 2: RRule.WE, 3: RRule.TH, 4: RRule.FR, 5: RRule.SA, 6: RRule.SU
}

export default function HouseholdPage({ params }: { params: { id: string }}) {
    const householdId = params.id
    const [members, setMembers] = useState<Profile[]>([])
    const [chores, setChores] = useState<any[]>([])
    const [title, setTitle] = useState("")
    const [categoryEmoji, setCategoryEmoji] = useState("🧹")
    const [dueTime, setDueTime] = useState("18:00")
    const [recurrence, setRecurrence] = useState<"none"|"daily"|"weekly"|"monthly"|"yearly"|"custom_weekdays">("weekly")
    const [customWeekdays, setCustomWeekdays] = useState<number[]>([0]) // Monday
    const [interval, setInterval] = useState(1)
    const [notify, setNotify] = useState<number | null>(null)
    const [assignees, setAssignees] = useState<string[]>([])

    async function load() {
        const { data: m } = await supabase
            .from("household_members")
            .select("user_id, profiles(id, display_name, emoji)")
            .eq("household_id", householdId)
            .order("added_at", { ascending: true })

        const mem = (m ?? []).map((row: any) => row.profiles).filter(Boolean)
        setMembers(mem)

        const { data: c } = await supabase
            .from("chores")
            .select("*, chore_assignees(user_id)")
            .eq("household_id", householdId)
            .order("created_at", { ascending: false })

        setChores(c ?? [])
    }

    useEffect(() => { load() }, [])

    function toggleWeekday(i: number) {
        setCustomWeekdays(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i].sort())
    }

    async function createChore() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!title.trim() || !user) return

        const { data: chore, error } = await supabase.from("chores")
            .insert({
                household_id: householdId,
                title,
                category_emoji: categoryEmoji || null,
                due_time: dueTime,
                recurrence,
                custom_weekdays: recurrence === "custom_weekdays" ? customWeekdays : null,
                interval,
                notify_minutes_before: notify,
                created_by: user.id
            })
            .select("*").single()

        if (error) { console.error(error); return }
        if (assignees.length) {
            await supabase.from("chore_assignees").insert(
                assignees.map(uid => ({ chore_id: chore.id, user_id: uid }))
            )
        }
        setTitle("")
        setAssignees([])
        await load()
    }

    // naive local preview of next dates (without saving occurrences yet)
    const previewDates = useMemo(() => {
        if (recurrence === "none") return []
        const today = new Date()
        const [h, m] = dueTime.split(":").map(Number)
        const start = set(today, { hours: h||18, minutes: m||0, seconds: 0, milliseconds:0 })
        const rs = new RRuleSet()
        switch (recurrence) {
            case "daily":
                rs.rrule(new RRule({ freq: RRule.DAILY, interval, dtstart: start }))
                break
            case "weekly":
                rs.rrule(new RRule({ freq: RRule.WEEKLY, interval, byweekday: [RRule.MO], dtstart: start }))
                break
            case "custom_weekdays":
                rs.rrule(new RRule({ freq: RRule.WEEKLY, interval, byweekday: customWeekdays.map(i => WDAY[i]), dtstart: start }))
                break
            case "monthly":
                rs.rrule(new RRule({ freq: RRule.MONTHLY, interval, dtstart: start }))
                break
            case "yearly":
                rs.rrule(new RRule({ freq: RRule.YEARLY, interval, dtstart: start }))
                break
        }
        return rs.all((d, i) => i < 5) // next 5
    }, [recurrence, interval, customWeekdays, dueTime])

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-8">
            <h1 className="text-xl font-semibold">Household</h1>

            <section className="space-y-4">
                <h2 className="font-medium">Add chore</h2>
                <div className="grid gap-3">
                    <input className="border rounded px-3 py-2" placeholder="Chore title (e.g., Walk the dog)" value={title} onChange={e=>setTitle(e.target.value)} />
                    <div className="flex gap-2 items-center">
                        <span>Category</span>
                        <input className="border rounded px-2 py-1 w-16 text-center" value={categoryEmoji} onChange={e=>setCategoryEmoji(e.target.value)} />
                        <span className="text-xs opacity-70">e.g. 🐶</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span>Due time</span>
                        <input type="time" className="border rounded px-2 py-1" value={dueTime} onChange={e=>setDueTime(e.target.value)} />
                    </div>
                    <div className="flex gap-2 items-center">
                        <label>Recurrence</label>
                        <select className="border rounded px-2 py-1" value={recurrence} onChange={e=>setRecurrence(e.target.value as any)}>
                            <option value="none">One-off (set deadline date later)</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly (Mon)</option>
                            <option value="custom_weekdays">Custom weekdays</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <span>every</span>
                        <input type="number" min={1} className="border rounded w-16 px-2 py-1" value={interval} onChange={e=>setInterval(parseInt(e.target.value||"1"))} />
                    </div>

                    {recurrence === "custom_weekdays" && (
                        <div className="flex gap-1">
                            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                                <button
                                    key={d}
                                    onClick={()=>toggleWeekday(i)}
                                    className={`px-2 py-1 border rounded text-sm ${customWeekdays.includes(i) ? 'bg-black text-white' : ''}`}
                                >{d}</button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        <label>Notify</label>
                        <select className="border rounded px-2 py-1" value={notify ?? ""} onChange={e=>setNotify(e.target.value ? parseInt(e.target.value) : null)}>
                            <option value="">No notification</option>
                            <option value="5">5 min before</option>
                            <option value="15">15 min before</option>
                            <option value="60">1 hour before</option>
                            <option value="1440">1 day before</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm">Assignees</div>
                        <div className="flex flex-wrap gap-2">
                            {members.map(m => {
                                const active = assignees.includes(m.id)
                                return (
                                    <button key={m.id}
                                            onClick={()=>setAssignees(prev => active ? prev.filter(id=>id!==m.id) : [...prev, m.id])}
                                            className={`px-2 py-1 border rounded text-sm ${active ? 'bg-black text-white' : ''}`}>
                                        {m.emoji ?? "👤"} {m.display_name ?? "User"}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <button onClick={createChore} className="border rounded px-4 py-2">Save chore</button>

                    {previewDates.length > 0 && (
                        <div className="text-xs opacity-80">
                            Next: {previewDates.map(d => d.toLocaleString()).join(" • ")}
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="font-medium">Chores</h2>
                <ul className="space-y-2">
                    {chores.map(c => (
                        <li key={c.id} className="border rounded p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{c.category_emoji ?? "🧼"}</span>
                                    <div>
                                        <div className="font-medium">{c.title}</div>
                                        <div className="text-xs opacity-70">{c.recurrence !== "none" ? `Repeats ${c.recurrence}` : "One-off"}</div>
                                    </div>
                                </div>
                                <div className="text-sm opacity-70">{c.due_time ?? ""}</div>
                            </div>
                            {c.chore_assignees?.length > 0 && (
                                <div className="text-xs mt-2">
                                    Assigned to: {c.chore_assignees.map((a:any)=>members.find(m=>m.id===a.user_id)?.display_name ?? "—").join(", ")}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    )
}