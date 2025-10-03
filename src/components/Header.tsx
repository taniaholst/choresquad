"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getCachedHouseholdName,
  fetchHouseholdName,
} from "@/lib/household-cache";

export default function Header() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // fetch display name of current user
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setDisplayName(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (!error && data?.display_name) {
        setDisplayName(data.display_name);
      }
    })();
  }, []);

  // fetch household name if pathname contains householdId
  useEffect(() => {
    const match = pathname.match(/^\/households\/([^/]+)/);
    if (!match) {
      setHouseholdName(null);
      return;
    }
    const householdId = match[1];

    const cached = getCachedHouseholdName(householdId);
    if (cached) {
      setHouseholdName(cached);
      return;
    }

    (async () => {
      const name = await fetchHouseholdName(householdId, async () => {
        const { data, error } = await supabase
          .from("households")
          .select("name")
          .eq("id", householdId)
          .single();
        if (error || !data) throw error ?? new Error("Not found");
        return { name: data.name };
      });
      if (name) setHouseholdName(name);
    })();
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setDisplayName(null);
    setHouseholdName(null);
    router.replace("/");
  }

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b">
      <h1 className="text-lg font-semibold truncate">
        ChoreSquad{householdName ? ` · ${householdName}` : ""}
      </h1>
      {displayName && (
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">👋 {displayName}</span>
          <button
            onClick={handleLogout}
            className="text-xs underline text-red-600"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
