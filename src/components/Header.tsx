"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUserId } from "@/hooks/useAuthUserId";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useHouseholdName } from "@/hooks/useHouseholdName";
import { getHouseholdIdFromPath } from "@/lib/path";
import { supabase } from "@/lib/supabase";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const userId = useAuthUserId();
  const displayName = useDisplayName(userId);
  const householdName = useHouseholdName(getHouseholdIdFromPath(pathname));
  const [, setToastMsg] = useState<string | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b">
      <h1 className="text-lg font-semibold truncate">
        ChoreSquad{householdName ? ` · ${householdName}` : ""}
      </h1>

      {userId && displayName && (
        <div className="flex items-center gap-3">
          <ProfileEditor
            userId={userId}
            displayName={displayName}
            setToastMsg={setToastMsg}
            onSaved={() => {
              // no-op; header will re-render via useDisplayName polling
              // if you later add realtime, it'll update instantly
            }}
          />
          <button
            onClick={handleLogout}
            className="text-xs underline text-red-600"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
