"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [name, setName] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);

  const pathname = usePathname();

  // Load display name
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (profile?.display_name) setName(profile.display_name);
    })();
  }, []);

  // Load household name if path matches /households/[id]
  useEffect(() => {
    const match = pathname.match(/^\/households\/([^/]+)/);
    if (!match) {
      setHouseholdName(null);
      return;
    }

    const householdId = match[1];
    (async () => {
      const { data, error } = await supabase
        .from("households")
        .select("name")
        .eq("id", householdId)
        .single();
      if (!error && data) {
        setHouseholdName(data.name);
      }
    })();
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/"; // redirect home
  }

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b">
      <h1 className="text-lg font-semibold">
        ChoreSquad
        {householdName ? ` · ${householdName}` : ""}
      </h1>
      {name && (
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">👋 {name}</span>
          <button onClick={handleLogout} className="text-xs underline">
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
