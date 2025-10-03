"use server";
import { supabase } from "@/lib/supabase";

export async function saveProfile(userId: string, displayName: string) {
  if (!userId || !displayName.trim()) return false;

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: displayName.trim(),
  });

  if (error) {
    console.error("Error saving profile:", error.message);
    return false;
  }
  return true;
}

export async function getProfile(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    return null;
  }

  return data?.display_name ?? null;
}
