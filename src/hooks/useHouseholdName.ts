"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePoll } from "@/hooks/usePoll";
import {
  getCachedHouseholdName,
  fetchHouseholdName,
  setCachedHouseholdName,
} from "@/lib/household-cache";

export function useHouseholdName(
  householdId: string | null,
  intervalMs = 15000,
) {
  const [name, setName] = useState<string | null>(null);

  // initial load + cache
  useEffect(() => {
    if (!householdId) {
      setName(null);
      return;
    }
    const cached = getCachedHouseholdName(householdId);
    if (cached) setName(cached);

    (async () => {
      const fresh = await fetchHouseholdName(householdId, async () => {
        const { data, error } = await supabase
          .from("households")
          .select("name")
          .eq("id", householdId)
          .single();
        if (error || !data) throw error ?? new Error("Not found");
        return { name: data.name };
      });
      if (fresh) {
        setName(fresh);
        setCachedHouseholdName(householdId, fresh);
      }
    })();
  }, [householdId]);

  // poll for changes
  usePoll(
    async () => {
      if (!householdId) {
        setName(null);
        return;
      }
      const { data, error } = await supabase
        .from("households")
        .select("name")
        .eq("id", householdId)
        .single();
      if (!error && data?.name) {
        setName(data.name);
        setCachedHouseholdName(householdId, data.name);
      }
    },
    intervalMs,
    [householdId],
    { immediate: false },
  );

  return name;
}
