"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/Toast";
import HouseholdList from "@/components/households/HouseholdList";
import { useHouseholds } from "@/hooks/useHouseholds";
import { createHouseholdWithName, renameHousehold } from "@/actions/households";
import AuthTabs from "@/components/auth/AuthTabs";
import { useProfile } from "@/hooks/useProfile";
import SetProfileForm from "@/components/auth/SetProfileForm";

export default function HomeClient() {
  const search = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sess = await supabase.auth.getSession();
      console.log("has session?", !!sess.data.session);
      console.log("user id:", sess.data.session?.user?.id);
      console.log("access token present?", !!sess.data.session?.access_token);

      const { data } = await supabase.rpc("whoami");
      console.log("whoami() →", data);
    })();
  }, []);

  // profile flags live in the hook
  const { displayName, hasPassword, loading, mutate } = useProfile(userId);

  // households
  const { households, setHouseholds } = useHouseholds(userId);

  // bootstrap session + auth listener
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) setUserId(session.user.id);
      else setUserId(null);
    });

    return () => sub.subscription.unsubscribe();
  }, [search]);

  // actions
  async function handleCreateHousehold(hhName: string) {
    if (!userId) return;

    const res = await createHouseholdWithName(userId, hhName);

    if (!res.ok) {
      // if partial is true, the household was created but membership failed
      setToastMsg(
        res.partial
          ? `⚠️ ${res.error}`
          : `❌ ${res.error || "Failed to create household"}`,
      );
      return;
    }

    setHouseholds((prev) => [res.household, ...prev]);
    setToastMsg("🎉 Household created");
  }

  async function handleRenameHousehold(id: string, newName: string) {
    const ok = await renameHousehold(id, newName);
    if (!ok) return setToastMsg("❌ Failed to rename household");
    setHouseholds((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: newName } : h)),
    );
    setToastMsg("✏️ Household renamed");
  }

  async function handleJoinHousehold(code: string) {
    if (!userId) return;
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setToastMsg("❌ Enter an invite code");
      return;
    }

    // Try to find household by invite code (may be blocked by RLS; see note below)
    // Join via secure RPC (does lookup + membership server-side)
    const { data, error } = await supabase.rpc("join_household", {
      p_code: normalized,
    });

    if (error || !data?.length) {
      setToastMsg(`❌ ${error?.message ?? "Invalid invite code"}`);
      return;
    }

    const hh = data[0] as { id: string; name: string; invite_code: string };

    // Avoid duplicates if already in local state
    if (households.some((h) => h.id === hh.id)) {
      setToastMsg("ℹ️ You're already a member of this household");
      return;
    }

    // Insert membership for current user
    const { error: mErr } = await supabase
      .from("household_members")
      .insert([{ household_id: hh.id, user_id: userId }]);

    if (mErr) {
      setToastMsg(`❌ Failed to join: ${mErr.message}`);
      return;
    }

    setHouseholds((prev) => [hh, ...prev]);
    setToastMsg("🎉 Joined household");
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ChoreSquad</h1>
      <p className="text-sm opacity-80">
        Create a household, invite people, add recurring chores, and assign
        them.
      </p>

      {!userId ? (
        <AuthTabs setToastMsg={setToastMsg} />
      ) : loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : !hasPassword || !displayName ? (
        <SetProfileForm
          setToastMsg={setToastMsg}
          onDone={() => {
            mutate();
            setToastMsg("✅ Account set up");
          }}
        />
      ) : (
        <HouseholdList
          name={displayName}
          households={households}
          onCreate={handleCreateHousehold}
          onRename={handleRenameHousehold}
          onJoin={handleJoinHousehold}
        />
      )}

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </main>
  );
}
