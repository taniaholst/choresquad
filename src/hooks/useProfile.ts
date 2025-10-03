"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProfile(userId: string | null) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDisplayName(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      setDisplayName(profile?.display_name ?? null);
      setLoading(false);
    })();
  }, [userId]);

  return { displayName, setDisplayName, loading };
}
