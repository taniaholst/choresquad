"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthListener() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await fetch("/api/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event, session }),
        });
      },
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
