"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthUserId } from "@/hooks/useAuthUserId";
import { useDisplayName } from "@/hooks/useDisplayName";
import { useHouseholdName } from "@/hooks/useHouseholdName";
import { getHouseholdIdFromPath } from "@/lib/path";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const userId = useAuthUserId();
  const displayName = useDisplayName(userId);
  const householdName = useHouseholdName(getHouseholdIdFromPath(pathname));

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b">
      <Link href="/" className="text-lg font-semibold truncate hover:underline">
        ChoreSquad{householdName ? ` · ${householdName}` : ""}
      </Link>
      {displayName && (
        <div className="flex items-center gap-3">
          <span
            className="text-sm opacity-80 cursor-pointer hover:underline"
            onClick={() => router.push("/profile")}
          >
            👋 {displayName}
          </span>
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
