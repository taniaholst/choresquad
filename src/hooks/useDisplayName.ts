"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePoll } from "@/hooks/usePoll";

export function useDisplayName(userId: string | null, intervalMs = 15000) {
  const [displayName, setDisplayName] = useState<string | null>(null);

  // initial load
  useEffect(() => {
    if (!userId) {
      setDisplayName(null);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      if (!error) setDisplayName(data?.display_name ?? null);
    })();
  }, [userId]);

  // poll updates (stopgap until Realtime is available)
  usePoll(
    async () => {
      if (!userId) {
        setDisplayName(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      if (!error) setDisplayName(data?.display_name ?? null);
    },
    intervalMs,
    [userId],
  );

  return displayName;
}
