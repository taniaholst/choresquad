"use client";
import { supabase } from "@/lib/supabase";

// Sign up via magic link (email only)
export async function sendMagicLink(email: string, redirectTo: string) {
  if (!email.trim()) return { ok: false, error: "Email is required" };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Traditional sign-in: email + password
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// After OTP signup: set password on the current session
export async function setPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
