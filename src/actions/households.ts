"use server";
import { supabase } from "@/lib/supabase";
import type { Household } from "@/components/households/HouseholdList";

type CreateHouseholdResult =
  | { ok: true; household: Household }
  | { ok: false; error: string; partial?: boolean };

export async function createHouseholdWithName(
  userId: string,
  name: string,
): Promise<CreateHouseholdResult> {
  const trimmed = name.trim();
  if (!userId) return { ok: false, error: "No userId" };
  if (!trimmed) return { ok: false, error: "Please enter a household name" };

  // 1) Create household (RLS must allow owner_id = auth.uid())
  const { data: hh, error: hhErr } = await supabase
    .from("households")
    .insert([{ name: trimmed }])
    .select("*")
    .single();

  if (hhErr) {
    console.error("Household insert error:", {
      code: hhErr.code,
      message: hhErr.message,
      details: hhErr.details,
      hint: hhErr.hint,
    });
    console.log(`❌ ${hhErr.code ?? ""} ${hhErr.message}`.trim());
  }

  await supabase
    .from("households")
    .insert([{ name: trimmed }])
    .select("*")
    .single();

  // 2) Add creator as member (RLS must allow INSERT with user_id = auth.uid())
  const { error: memErr } = await supabase
    .from("household_members")
    .insert([{ household_id: hh.id, user_id: userId }]);

  if (memErr) {
    const msg = memErr.message?.includes("row-level security")
      ? "Household created, but membership insert blocked by RLS. Ensure INSERT policy: WITH CHECK (user_id = auth.uid())."
      : `Household created, but failed to add you as a member: ${memErr.message}`;
    // mark as partial so UI can decide what to do (e.g., show warning + reload)
    return { ok: false, error: msg, partial: true };
  }

  return { ok: true, household: hh as Household };
}

export async function renameHousehold(
  id: string,
  newName: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("households")
    .update({ name: newName })
    .eq("id", id);

  if (error) {
    console.error("Error renaming household:", error.message);
    return false;
  }
  return true;
}
