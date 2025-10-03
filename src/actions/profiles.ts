"use client"; // ⬅️ change from "use server"
import { supabase } from "@/lib/supabase";

export async function saveProfile(userId: string, displayName: string) {
  if (!userId || !displayName.trim())
    return { ok: false, error: "Missing data" };
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: displayName.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getProfile(userId: string) {
  if (!userId) return { ok: false, displayName: null, error: "No user" };
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  if (error) return { ok: false, displayName: null, error: error.message };
  return { ok: true, displayName: data?.display_name ?? null };
}
