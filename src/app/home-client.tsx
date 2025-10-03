"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/Toast";

type Household = {
  id: string;
  name: string;
  invite_code: string;
};

export default function HomeClient() {
  const router = useRouter();
  const search = useSearchParams();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "signedin" | "saving">(
    "idle",
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [welcomeFlag, setWelcomeFlag] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [hasDisplayName, setHasDisplayName] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);

  useEffect(() => {
    const flag = search.get("welcome");
    if (flag) setWelcomeFlag(flag);
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setStatus("signedin");

        // check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (profile?.display_name) {
          setHasDisplayName(true);
          setName(profile.display_name);
        }

        // fetch households where user is member
        const { data: memberships } = await supabase
          .from("household_members")
          .select("households(id, name, invite_code)")
          .eq("user_id", user.id);

        type MembershipRow = { households: Household | Household[] | null };

        const hhRows = (memberships ?? []) as MembershipRow[];
        const hh = hhRows
          .map((r) =>
            Array.isArray(r.households) ? r.households[0] : r.households,
          )
          .filter((x): x is Household => Boolean(x));

        setHouseholds(hh);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setStatus("signedin");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [search]);

  async function sendMagicLink() {
    const emailRedirectTo = `${location.origin}/?welcome=1`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    if (error) return alert(error.message);
    setStatus("sent");
  }

  async function saveProfile() {
    if (!userId || !name.trim()) return;
    setStatus("saving");
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: name.trim(),
    });
    if (error) {
      setStatus("signedin");
      setToastMsg(`❌ ${error.message}`);
      return;
    }
    setHasDisplayName(true);
    setToastMsg("🎉 Profile saved");
  }

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
    // also insert membership for creator
    await supabase.from("household_members").insert({
      household_id: data.id,
      user_id: userId,
    });
    setHouseholds((prev) => [data, ...prev]);
    setToastMsg("🎉 Household created");
  }

  const isSignedIn = status === "signedin" || !!userId;

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ChoreSquad</h1>
      <p className="text-sm opacity-80">
        Create a household, invite people, add recurring chores, and assign
        them.
      </p>

      {!isSignedIn ? (
        // --- Login form ---
        <div className="space-y-3 border rounded p-4">
          <label className="text-sm font-medium">Sign in with magic link</label>
          <input
            className="border rounded px-3 py-2 w-full"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={sendMagicLink}
            className="border rounded px-4 py-2 w-full"
            disabled={!email}
          >
            Send magic link
          </button>
          {status === "sent" && (
            <div className="text-xs text-green-700">
              Email sent—check your inbox.
            </div>
          )}
        </div>
      ) : !hasDisplayName ? (
        // --- Choose display name ---
        <div className="border rounded p-4 space-y-3">
          {welcomeFlag && (
            <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
              ✅ You’re signed in.
            </div>
          )}
          <label className="text-sm font-medium">
            Choose your display name
          </label>
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="e.g., Tania"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={saveProfile}
            className="border rounded px-4 py-2 w-full"
            disabled={!name.trim() || status === "saving"}
          >
            {status === "saving" ? "Saving…" : "Save & continue"}
          </button>
          <p className="text-xs opacity-70">
            We’ll use this name in your household and on assignments.
          </p>
        </div>
      ) : households.length === 0 ? (
        // --- No household yet ---
        <div className="border rounded p-4 space-y-3">
          <div className="text-sm">
            👋 {name}, you don’t have a household yet.
          </div>
          <button
            onClick={createHousehold}
            className="border rounded px-4 py-2 w-full"
          >
            Create household
          </button>
        </div>
      ) : (
        // --- Show households ---
        <div className="border rounded p-4 space-y-4">
          <div className="text-sm">👋 {name}, here are your households:</div>
          <ul className="space-y-3">
            {households.map((h) => (
              <li key={h.id} className="border rounded p-3 space-y-2">
                <div className="font-medium">{h.name}</div>
                <div className="text-xs opacity-70">
                  Invite code: <code>{h.invite_code}</code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/households/${h.id}`)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    Show chores
                  </button>
                  <button
                    onClick={() => router.push(`/households/${h.id}`)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    Add chore
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={createHousehold}
            className="border rounded px-4 py-2 w-full"
          >
            + Create another household
          </button>
        </div>
      )}

      <p className="text-xs opacity-60">
        Tip: if the magic link opens on a different device, just come back to
        this page after clicking it—your session will be active here too.
      </p>
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </main>
  );
}
