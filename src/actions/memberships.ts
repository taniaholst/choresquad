"use client";
import { supabase } from "@/lib/supabase";

export type JoinedHousehold = { id: string; name: string; invite_code: string };

export async function joinByInviteCode(
  code: string,
): Promise<
  { ok: true; household: JoinedHousehold } | { ok: false; error: string }
> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter an invite code" };

  const { data, error } = await supabase.rpc("join_household", {
    p_code: normalized,
  });

  if (error || !data?.length) {
    return { ok: false, error: error?.message ?? "Invalid invite code" };
  }

  return { ok: true, household: data[0] as JoinedHousehold };
}
