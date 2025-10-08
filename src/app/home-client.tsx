"use client";
import { useState } from "react";
import { Toast } from "@/components/Toast";
import HouseholdList from "@/components/households/HouseholdList";
import { useHouseholds } from "@/hooks/useHouseholds";
import AuthTabs from "@/components/auth/AuthTabs";
import { useProfile } from "@/hooks/useProfile";
import SetProfileForm from "@/components/auth/SetProfileForm";
import { useAuthUserId } from "@/hooks/useAuthUserId";
import { useHouseholdActions } from "@/hooks/useHouseholdActions";

export default function HomeClient() {
  const userId = useAuthUserId();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { displayName, hasPassword, loading, mutate } = useProfile(userId);
  const { households, setHouseholds } = useHouseholds(userId);

  const { onCreate, onRename, onJoin } = useHouseholdActions({
    userId,
    households,
    setHouseholds,
    setToastMsg,
  });

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
          onCreate={onCreate}
          onRename={onRename}
          onJoin={onJoin}
        />
      )}

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </main>
  );
}
