"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RRule, RRuleSet, Weekday } from "rrule";
import { set as setTime } from "date-fns";
import type {
  Chore,
  ChoreOccurrence,
  Profile,
  Recurrence,
  HouseholdMemberRow,
} from "@/types/db";
import { Toast } from "@/components/Toast";
import { setCachedHouseholdName } from "@/lib/household-cache";

const WDAY: Record<number, Weekday> = {
  0: RRule.MO,
  1: RRule.TU,
  2: RRule.WE,
  3: RRule.TH,
  4: RRule.FR,
  5: RRule.SA,
  6: RRule.SU,
};

export default function HouseholdPage({ params }: { params: { id: string } }) {
  const householdId = params.id;

  const [members, setMembers] = useState<Profile[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("🧹");
  const [dueTime, setDueTime] = useState("18:00");
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([0]); // Monday
  const [interval, setInterval] = useState<number>(1);
  const [notify, setNotify] = useState<number | null>(null);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [occurrences, setOccurrences] = useState<ChoreOccurrence[]>([]);

  async function load() {
    // fetch household name first
    const { data: hh } = await supabase
      .from("households")
      .select("name")
      .eq("id", householdId)
      .single();

    if (hh?.name) {
      setCachedHouseholdName(householdId, hh.name);
    }

    // members
    const { data: m } = await supabase
      .from("household_members")
      .select("user_id, profiles(id, display_name, emoji)")
      .eq("household_id", householdId)
      .order("added_at", { ascending: true });

    const mem: Profile[] = ((m ?? []) as HouseholdMemberRow[])
      .map((row) =>
        Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      )
      .filter((p): p is Profile => Boolean(p));
    setMembers(mem);

    // chores
    const { data: c } = await supabase
      .from("chores")
      .select("*, chore_assignees(user_id)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });
    setChores((c ?? []) as Chore[]);

    // occurrences (for this household’s chores)
    const { data: o } = await supabase
      .from("chore_occurrences")
      .select("id, chore_id, due_at, status, completed_at, completed_by")
      .in(
        "chore_id",
        (c ?? []).map((ch) => ch.id),
      )
      .order("due_at", { ascending: true });
    setOccurrences((o ?? []) as ChoreOccurrence[]);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function toggleWeekday(i: number) {
    setCustomWeekdays((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort(),
    );
  }

  async function createChore() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!title.trim() || !user) {
      setToastMsg("❌ Please add a title and sign in");
      return;
    }

    const { data: inserted, error } = await supabase
      .from("chores")
      .insert({
        household_id: householdId,
        title,
        category_emoji: categoryEmoji || null,
        due_time: dueTime,
        recurrence,
        custom_weekdays:
          recurrence === "custom_weekdays" ? customWeekdays : null,
        interval,
        notify_minutes_before: notify,
        created_by: user.id,
      })
      .select("*");

    if (error || !inserted?.length) {
      setToastMsg(`❌ ${error?.message ?? "Failed to create chore"}`);
      return;
    }

    const chore = inserted[0];
    if (assignees.length) {
      const { error: aErr } = await supabase
        .from("chore_assignees")
        .insert(assignees.map((uid) => ({ chore_id: chore.id, user_id: uid })));
      if (aErr) {
        setToastMsg(`⚠️ Chore saved, but assignment failed: ${aErr.message}`);
      }
    }

    setTitle("");
    setAssignees([]);
    await load();
    setToastMsg("🧹 Chore saved");
  }

  const previewDates: Date[] = useMemo(() => {
    if (recurrence === "none") return [];
    const [h, m] = dueTime.split(":").map(Number);
    const start = setTime(new Date(), {
      hours: h || 18,
      minutes: m || 0,
      seconds: 0,
      milliseconds: 0,
    });
    const rs = new RRuleSet();

    switch (recurrence) {
      case "daily":
        rs.rrule(new RRule({ freq: RRule.DAILY, interval, dtstart: start }));
        break;
      case "weekly":
        rs.rrule(
          new RRule({
            freq: RRule.WEEKLY,
            interval,
            byweekday: [RRule.MO],
            dtstart: start,
          }),
        );
        break;
      case "custom_weekdays":
        rs.rrule(
          new RRule({
            freq: RRule.WEEKLY,
            interval,
            byweekday: customWeekdays.map((i) => WDAY[i]),
            dtstart: start,
          }),
        );
        break;
      case "monthly":
        rs.rrule(new RRule({ freq: RRule.MONTHLY, interval, dtstart: start }));
        break;
      case "yearly":
        rs.rrule(new RRule({ freq: RRule.YEARLY, interval, dtstart: start }));
        break;
      default:
        return [];
    }
    return rs.all((_, i) => i < 5);
  }, [recurrence, interval, customWeekdays, dueTime]);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-xl font-semibold">Household</h1>

      <section className="space-y-4">
        <h2 className="font-medium">Add chore</h2>
        <div className="grid gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Chore title (e.g., Walk the dog)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <span>Category</span>
            <input
              className="border rounded px-2 py-1 w-16 text-center"
              value={categoryEmoji}
              onChange={(e) => setCategoryEmoji(e.target.value)}
            />
            <span className="text-xs opacity-70">e.g. 🐶</span>
          </div>
          <div className="flex gap-2 items-center">
            <span>Due time</span>
            <input
              type="time"
              className="border rounded px-2 py-1"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <label>Recurrence</label>
            <select
              className="border rounded px-2 py-1"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            >
              <option value="none">One-off (set deadline date later)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Mon)</option>
              <option value="custom_weekdays">Custom weekdays</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="none">None</option>
            </select>
            <span>every</span>
            <input
              type="number"
              min={1}
              className="border rounded w-16 px-2 py-1"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value || "1", 10))}
            />
          </div>

          {recurrence === "custom_weekdays" && (
            <div className="flex gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <button
                  key={d}
                  onClick={() => toggleWeekday(i)}
                  className={`px-2 py-1 border rounded text-sm ${customWeekdays.includes(i) ? "bg-black text-white" : ""}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <label>Notify</label>
            <select
              className="border rounded px-2 py-1"
              value={notify ?? ""}
              onChange={(e) =>
                setNotify(e.target.value ? parseInt(e.target.value, 10) : null)
              }
            >
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
              {members.map((m) => {
                const active = assignees.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      setAssignees((prev) =>
                        active
                          ? prev.filter((id) => id !== m.id)
                          : [...prev, m.id],
                      )
                    }
                    className={`px-2 py-1 border rounded text-sm ${active ? "bg-black text-white" : ""}`}
                  >
                    {m.emoji ?? "👤"} {m.display_name ?? "User"}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={createChore} className="border rounded px-4 py-2">
            Save chore
          </button>

          {previewDates.length > 0 && (
            <div className="text-xs opacity-80">
              Next: {previewDates.map((d) => d.toLocaleString()).join(" • ")}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Upcoming occurrences</h2>
        <button
          className="border rounded px-3 py-1 text-xs"
          onClick={async () => {
            try {
              const res = await fetch("/api/backfill");
              const json = await res.json();
              setToastMsg(`✅ Backfilled ${json.created} occurrences`);
              await load();
              // @ts-expect-error TS2322 - `never` should never happen
            } catch (e: never) {
              setToastMsg(`❌ Backfill failed: ${e.message ?? e}`);
            }
          }}
        >
          Run backfill
        </button>
        {occurrences.length === 0 && (
          <div className="text-sm opacity-70">
            No occurrences yet. Try “Run backfill”.
          </div>
        )}
        <ul className="space-y-2">
          {occurrences.map((o) => {
            const chore = chores.find((c) => c.id === o.chore_id);
            return (
              <li
                key={o.id}
                className="border rounded p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {chore?.category_emoji ?? "🧹"}{" "}
                    {chore?.title ?? "Unknown chore"}
                  </div>
                  <div className="text-xs opacity-70">
                    Due: {new Date(o.due_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  {o.status === "done" ? (
                    <span className="text-green-600 text-sm">✅ Done</span>
                  ) : (
                    <button
                      className="border rounded px-2 py-1 text-xs"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("chore_occurrences")
                          .update({
                            status: "done",
                            completed_at: new Date().toISOString(),
                            completed_by: userId,
                          })
                          .eq("id", o.id);
                        if (!error) {
                          setToastMsg("🎉 Chore marked as done");
                          await load();
                        } else {
                          setToastMsg(`❌ ${error.message}`);
                        }
                      }}
                    >
                      Mark done
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <button
        className="border rounded px-3 py-1 text-xs"
        onClick={async () => {
          try {
            const res = await fetch("/api/backfill");
            const json = await res.json();
            setToastMsg(`✅ Backfilled ${json.created} occurrences`);
            // @ts-expect-error TS2322 - `never` should never happen
          } catch (e: never) {
            setToastMsg(`❌ Backfill failed: ${e.message ?? e}`);
          }
        }}
      >
        Run backfill
      </button>
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </main>
  );
}
