"use client";
import { useCallback } from "react";
import { createHouseholdWithName, renameHousehold } from "@/actions/households";
import { joinByInviteCode } from "@/actions/memberships";

type HH = { id: string; name: string; invite_code: string };

export function useHouseholdActions(opts: {
  userId: string | null;
  households: HH[];
  setHouseholds: React.Dispatch<React.SetStateAction<HH[]>>;
  setToastMsg: (msg: string | null) => void;
}) {
  const { userId, households, setHouseholds, setToastMsg } = opts;

  const onCreate = useCallback(
    async (hhName: string) => {
      if (!userId) return;
      const res = await createHouseholdWithName(userId, hhName);
      if (!res.ok) {
        setToastMsg(
          res.partial
            ? `⚠️ ${res.error}`
            : `❌ ${res.error || "Failed to create household"}`,
        );
        return;
      }
      setHouseholds((prev) => [res.household as HH, ...prev]);
      setToastMsg("🎉 Household created");
    },
    [userId, setHouseholds, setToastMsg],
  );

  const onRename = useCallback(
    async (id: string, newName: string) => {
      const ok = await renameHousehold(id, newName);
      if (!ok) {
        setToastMsg("❌ Failed to rename household");
        return;
      }
      setHouseholds((prev) =>
        prev.map((h) => (h.id === id ? { ...h, name: newName } : h)),
      );
      setToastMsg("✏️ Household renamed");
    },
    [setHouseholds, setToastMsg],
  );

  const onJoin = useCallback(
    async (code: string) => {
      if (!userId) return;
      const res = await joinByInviteCode(code);
      if (!res.ok) {
        setToastMsg(`❌ ${res.error}`);
        return;
      }
      const hh = res.household;
      if (households.some((h) => h.id === hh.id)) {
        setToastMsg("ℹ️ You're already a member of this household");
        return;
      }
      setHouseholds((prev) => [hh, ...prev]);
      setToastMsg("🎉 Joined household");
    },
    [userId, households, setHouseholds, setToastMsg],
  );

  return { onCreate, onRename, onJoin };
}
