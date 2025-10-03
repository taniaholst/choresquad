"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      alert(error.message);
      setStatus("signedin");
      return;
    }
    router.push("/households");
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
      ) : (
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
      )}

      <p className="text-xs opacity-60">
        Tip: if the magic link opens on a different device, just come back to
        this page after clicking it—your session will be active here too.
      </p>
    </main>
  );
}
