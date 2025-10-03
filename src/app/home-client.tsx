"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/Toast";
import LoginForm from "@/components/auth/LoginForm";
import DisplayNameForm from "@/components/auth/DisplayNameForm";
import HouseholdList from "@/components/households/HouseholdList";
import InviteModal from "@/components/households/InviteModal";
import { useProfile } from "@/hooks/useProfile";
import { useHouseholds } from "@/hooks/useHouseholds";

export default function HomeClient() {
  const search = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [welcomeFlag, setWelcomeFlag] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<string | null>(null);

  // watch for session
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

  const { displayName, setDisplayName } = useProfile(userId);
  const { households, setHouseholds } = useHouseholds(userId);

  async function createHousehold() {
    if (!userId) return;
    const { data, error } = await supabase
      .from("households")
      .insert({ name: "My Household", owner_id: userId })
      .select("*")
      .single();
    if (error) {
      setToastMsg(`❌ ${error.message}`);
      return;
    }
    await supabase.from("household_members").insert({
      household_id: data.id,
      user_id: userId,
    });
    setHouseholds((prev) => [data, ...prev]);
    setToastMsg("🎉 Household created");
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ChoreSquad</h1>
      <p className="text-sm opacity-80">
        Create a household, invite people, add recurring chores, and assign
        them.
      </p>

      {!userId ? (
        <LoginForm />
      ) : !displayName ? (
        <DisplayNameForm
          userId={userId}
          welcomeFlag={welcomeFlag}
          onSaved={(n) => {
            setDisplayName(n);
            setToastMsg("🎉 Profile saved");
          }}
        />
      ) : (
        <HouseholdList
          name={displayName}
          households={households}
          onCreate={createHousehold}
          onInvite={(code) => setInviteModal(code)}
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
