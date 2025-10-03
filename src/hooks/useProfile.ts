"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProfile(userId: string | null) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setDisplayName(null);
      setHasPassword(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, has_password")
      .eq("id", userId)
      .single();

    if (error) {
      setDisplayName(null);
      setHasPassword(false);
    } else {
      setDisplayName(data?.display_name ?? null);
      setHasPassword(Boolean(data?.has_password));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // expose mutate() to force-refresh from callers
  const mutate = useCallback(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { displayName, setDisplayName, hasPassword, loading, mutate };
}
