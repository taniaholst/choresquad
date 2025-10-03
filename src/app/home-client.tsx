"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/Toast";
import DisplayNameForm from "@/components/auth/DisplayNameForm";
import HouseholdList from "@/components/households/HouseholdList";
import InviteModal from "@/components/households/InviteModal";
import { useHouseholds } from "@/hooks/useHouseholds";
import { createHouseholdWithName, renameHousehold } from "@/actions/households";
import SetPasswordForm from "@/components/auth/SetPassworsForm"; // keep your existing path
import AuthTabs from "@/components/auth/AuthTabs";
import { useProfile } from "@/hooks/useProfile";

export default function HomeClient() {
  const search = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [welcomeFlag, setWelcomeFlag] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<string | null>(null);

  const { displayName, setDisplayName, hasPassword, loading, mutate } =
    useProfile(userId);

  const { households, setHouseholds } = useHouseholds(userId);

  useEffect(() => {
    const flag = search.get("welcome");
    if (flag) setWelcomeFlag(flag);

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

  async function handleCreateHousehold(hhName: string) {
    if (!userId) return;
    const newHousehold = await createHouseholdWithName(userId, hhName);
    if (!newHousehold) {
      setToastMsg("❌ Failed to create household");
      return;
    }
    setHouseholds((prev) => [newHousehold, ...prev]);
    setToastMsg("🎉 Household created");
  }

  async function handleRenameHousehold(id: string, newName: string) {
    const ok = await renameHousehold(id, newName);
    if (!ok) {
      setToastMsg("❌ Failed to rename household");
      return;
    }
    setHouseholds((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: newName } : h)),
    );
    setToastMsg("✏️ Household renamed");
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
      ) : !hasPassword ? (
        <SetPasswordForm
          setToastMsg={setToastMsg}
          onDone={() => {
            setToastMsg("🔒 Password set");
            mutate();
          }}
        />
      ) : hasPassword && !displayName ? (
        <DisplayNameForm
          userId={userId}
          welcomeFlag={welcomeFlag}
          setDisplayName={(n) => {
            setDisplayName(n);
            setToastMsg("🎉 Profile saved");
            mutate();
          }}
          setToastMsg={setToastMsg}
        />
      ) : (
        <HouseholdList
          name={displayName!}
          households={households}
          onCreate={handleCreateHousehold}
          onInvite={(code) => setInviteModal(code)}
          onRename={handleRenameHousehold}
        />
      )}

      <p className="text-xs opacity-60">
        Tip: if the magic link opens on a different device, just come back to
        this page after clicking it—your session will be active here too.
      </p>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}

      {inviteModal && (
        <InviteModal
          code={inviteModal}
          onClose={() => setInviteModal(null)}
          onCopied={() => setToastMsg("📋 Invite code copied")}
        />
      )}
    </main>
  );
}
