"use client";
import { useState } from "react";
import { setPassword } from "@/actions/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function isStrong(pw: string) {
  return (
    pw.length >= 8 && /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw) && /\d/.test(pw)
  );
}

export default function SetProfileForm({
  onDone,
  setToastMsg,
}: {
  onDone: () => void;
  setToastMsg?: (m: string | null) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return setToastMsg?.("❌ Please enter a display name");
    if (pw !== pw2) return setToastMsg?.("❌ Passwords do not match");
    if (!isStrong(pw))
      return setToastMsg?.(
        "❌ Password must be ≥8 chars, include a number and a special character",
      );

    setSaving(true);

    // 1) Save password in Supabase Auth
    const res = await setPassword(pw);
    if (!res.ok) {
      setSaving(false);
      setToastMsg?.(`❌ ${res.error ?? "Failed to set password"}`);
      return;
    }

    // 2) Update profile with has_password + display_name
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setToastMsg?.("❌ No active session after setting password");
      return;
    }

    const { error: upErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, has_password: true, display_name: name.trim() });
    if (upErr) {
      setSaving(false);
      setToastMsg?.(`❌ Failed to update profile: ${upErr.message}`);
      return;
    }

    setSaving(false);
    setToastMsg?.("🎉 Profile saved");
    onDone(); // parent will reload profile
    router.replace("/"); // move forward (or /households if you prefer)
  }

  return (
    <form
      className="border rounded p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="text-sm">Finish setting up your profile</div>

      <label className="text-sm font-medium">Display name</label>
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="e.g., Tania"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="text-sm font-medium">Password</label>
      <input
        className="border rounded px-3 py-2 w-full"
        type="password"
        placeholder="New password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 w-full"
        type="password"
        placeholder="Repeat password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
      />

      <button className="border rounded px-4 py-2 w-full" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </button>

      <p className="text-xs opacity-70">
        Must be at least 8 chars, incl. one number and one special character.
      </p>
    </form>
  );
}
