"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfileForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? "");
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (data?.display_name) setDisplayName(data.display_name);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return;

    if (displayName) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
    }

    if (email !== user.email) {
      await supabase.auth.updateUser({ email });
    }

    if (password.trim()) {
      await supabase.auth.updateUser({ password });
    }

    setSaving(false);
    alert("✅ Profile updated");
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 border rounded p-4">
      <div>
        <label className="text-sm font-medium">Display name</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          className="border rounded px-3 py-2 w-full"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">New password</label>
        <input
          className="border rounded px-3 py-2 w-full"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs opacity-60">
          Leave blank if you don’t want to change it.
        </p>
      </div>
      <button
        type="submit"
        className="border rounded px-4 py-2 w-full"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
