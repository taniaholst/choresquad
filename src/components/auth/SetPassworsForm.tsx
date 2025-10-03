"use client";
import { useState } from "react";
import { setPassword } from "@/actions/auth";
import { supabase } from "@/lib/supabase";

function isStrong(pw: string) {
  return (
    pw.length >= 8 && /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw) && /\d/.test(pw)
  );
}

export default function SetPasswordForm({
  onDone,
  setToastMsg,
}: {
  onDone: () => void;
  setToastMsg?: (m: string | null) => void;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (pw !== pw2) return setToastMsg?.("❌ Passwords do not match");
    if (!isStrong(pw))
      return setToastMsg?.(
        "❌ Password must be ≥8 chars, include a number and a special character",
      );
    setSaving(true);
    const res = await setPassword(pw);
    if (!res.ok) {
      setSaving(false);
      setToastMsg?.(`❌ ${res.error ?? "Failed to set password"}`);
      return;
    }
    // mark profile flag
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ has_password: true })
        .eq("id", user.id);
    }
    setSaving(false);
    setToastMsg?.("🔒 Password set");
    onDone();
  }

  return (
    <form
      className="border rounded p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="text-sm">Create a password for quick sign-ins</div>
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
        {saving ? "Saving…" : "Set password"}
      </button>
      <p className="text-xs opacity-70">
        Must be at least 8 chars, incl. one number and one special character.
      </p>
    </form>
  );
}
