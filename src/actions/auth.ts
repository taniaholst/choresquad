"use client";
import { supabase } from "@/lib/supabase";

export async function sendMagicLink(email: string, redirectTo: string) {
  if (!email.trim()) return { ok: false, error: "Email is required" };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}
