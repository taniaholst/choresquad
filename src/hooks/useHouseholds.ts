"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Household } from "@/components/households/HouseholdList";

export function useHouseholds(userId: string | null) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setHouseholds([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: memberships } = await supabase
        .from("household_members")
        .select("households(id, name, invite_code)")
        .eq("user_id", userId);

      type MembershipRow = { households: Household | Household[] | null };
      const hhRows = (memberships ?? []) as MembershipRow[];
      const hh = hhRows
        .map((r) =>
          Array.isArray(r.households) ? r.households[0] : r.households,
        )
        .filter((x): x is Household => Boolean(x));

      setHouseholds(hh);
      setLoading(false);
    })();
  }, [userId]);

  return { households, setHouseholds, loading };
}
