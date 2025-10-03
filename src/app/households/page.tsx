"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/Toast";
import type { Household } from "@/types/db";

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [name, setName] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) console.error("Load households failed:", error);
      setHouseholds((data ?? []) as Household[]);
    })();
  }, []);

  function copyInvite(code: string) {
    navigator.clipboard.writeText(code);
    setToastMsg("✅ Invite code copied");
  }

  async function createHousehold() {
    if (!name.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setToastMsg("❌ Please sign in first");
      return;
    }

    const { data, error } = await supabase
      .from("households")
      .insert({ name, owner_id: user.id }) // invite_code generated server-side
      .select("*")
      .single();

    if (error) {
      console.error("Insert household failed:", error);
      setToastMsg(`❌ ${error.message}`);
      return;
    }

    setName("");
    setHouseholds((prev) => (data ? [data, ...prev] : prev));
    setToastMsg("🎉 Household created");
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h2 className="text-xl font-semibold">Your households</h2>

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Household name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={createHousehold} className="border rounded px-4">
          Create
        </button>
      </div>

      <ul className="space-y-2">
        {households.map((h) => (
          <li
            key={h.id}
            className="border rounded p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{h.name}</div>
              <div className="text-xs opacity-70">
                Invite code: <code>{h.invite_code}</code>
                <button
                  className="ml-2 underline text-xs"
                  onClick={() => copyInvite(h.invite_code)}
                  title="Copy invite code"
                >
                  Copy
                </button>
              </div>
            </div>
            <Link href={`/households/${h.id}`} className="underline">
              Open
            </Link>
          </li>
        ))}
      </ul>
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </main>
  );
}
