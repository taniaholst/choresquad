import { supabase } from "@/lib/supabase";
import type { Household } from "@/components/households/HouseholdList";

export type CreateHouseholdResult =
  | { ok: true; household: Household }
  | { ok: false; error: string; partial?: boolean };

export async function createHouseholdWithName(
  userId: string,
  name: string,
): Promise<CreateHouseholdResult> {
  const trimmed = name.trim();
  if (!userId) return { ok: false, error: "No userId" };
  if (!trimmed) return { ok: false, error: "Please enter a household name" };

  const { data: hh, error: hhErr } = await supabase
    .from("households")
    .insert([{ name: trimmed }])
    .select("*")
    .single();

  if (hhErr || !hh) {
    const code = hhErr?.code ?? "";
    const msg = hhErr?.message ?? "Failed to create household.";
    const details = hhErr?.details;
    const hint = hhErr?.hint;
    console.error("Household insert error:", { code, msg, details, hint });
    return { ok: false, error: `${code} ${msg}`.trim() };
  }

  // Add creator as a member (RLS policy: WITH CHECK (user_id = auth.uid()))
  const { error: memErr } = await supabase
    .from("household_members")
    .insert([{ household_id: hh.id, user_id: userId }]);

  if (memErr) {
    const msg = memErr.message?.includes("row-level security")
      ? "Household created, but membership insert was blocked by RLS. Ensure INSERT policy: WITH CHECK (user_id = auth.uid())."
      : `Household created, but failed to add you as a member: ${memErr.message}`;
    // Mark partial so UI can warn user; household exists though.
    return { ok: false, error: msg, partial: true };
  }

  return { ok: true, household: hh as Household };
}

export async function renameHousehold(
  id: string,
  newName: string,
): Promise<boolean> {
  const trimmed = newName.trim();
  if (!trimmed) return false;

  const { error } = await supabase
    .from("households")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    console.error("Error renaming household:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }
  return true;
}
