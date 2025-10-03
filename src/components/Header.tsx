"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getCachedHouseholdName,
  fetchHouseholdName,
  setCachedHouseholdName,
} from "@/lib/household-cache";

export default function Header() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 1) Bootstrap user + initial display name
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        setDisplayName(null);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (data?.display_name) setDisplayName(data.display_name);
    })();
  }, []);

  // 2) Subscribe to display_name changes for current user
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`header-profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as { display_name?: string } | null)
            ?.display_name;
          if (typeof next === "string") setDisplayName(next);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // Helper to extract householdId from path
  function getHouseholdIdFromPath(p: string) {
    const match = p.match(/^\/households\/([^/]+)/);
    return match ? match[1] : null;
  }

  // 3) Load + cache household name on path change
  useEffect(() => {
    const householdId = getHouseholdIdFromPath(pathname);
    if (!householdId) {
      setHouseholdName(null);
      return;
    }

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

  // 4) Subscribe to household name changes for current path household
  useEffect(() => {
    const householdId = getHouseholdIdFromPath(pathname);
    if (!householdId) return;

    const channel = supabase
      .channel(`header-household-${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "households",
          filter: `id=eq.${householdId}`,
        },
        (payload) => {
          const next = (payload.new as { name?: string } | null)?.name;
          if (typeof next === "string") {
            setHouseholdName(next);
            setCachedHouseholdName(householdId, next);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
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
