"use server";
import { supabase } from "@/lib/supabase";
import type { Household } from "@/components/households/HouseholdList";

export async function createHouseholdWithName(
  userId: string,
  name: string,
): Promise<Household | null> {
  const { data, error } = await supabase
    .from("households")
    .insert({ name, owner_id: userId })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating household:", error?.message);
    return null;
  }

  // also add creator as a member
  const { error: memberError } = await supabase
    .from("household_members")
    .insert({
      household_id: data.id,
      user_id: userId,
    });

  if (memberError) {
    console.error("Error inserting membership:", memberError.message);
  }

  return data as Household;
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
