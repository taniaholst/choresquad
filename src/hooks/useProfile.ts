"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProfile(userId: string | null) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDisplayName(null);
      setProfileExists(false);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      if (error) {
        setProfileExists(false);
        setDisplayName(null);
      } else {
        setProfileExists(true);
        setDisplayName(data?.display_name ?? null);
      }
      setLoading(false);
    })();
  }, [userId]);

  return { displayName, setDisplayName, profileExists, loading };
}
