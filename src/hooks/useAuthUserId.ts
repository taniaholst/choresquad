"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAuthUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) setUserId(user?.id ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return userId;
}
