"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

function isStrongPassword(pw: string) {
  return (
    pw.length >= 8 && /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw) && /\d/.test(pw)
  );
}
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function ProfileForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (data?.display_name) setDisplayName(data.display_name);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      alert("❌ Not signed in");
      setSaving(false);
      return;
    }

    // 1) Update profile display name
    if (!displayName.trim()) {
      alert("❌ Display name cannot be empty");
      setSaving(false);
      return;
    }
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    if (profErr) {
      alert(`❌ Failed to update name: ${profErr.message}`);
      setSaving(false);
      return;
    }

    // 2) Update email (in Auth)
    if (email !== (user.email ?? "")) {
      if (!isEmail(email)) {
        alert("❌ Please enter a valid email address");
        setSaving(false);
        return;
      }
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        alert(`❌ Failed to update email: ${emailErr.message}`);
        setSaving(false);
        return;
      }
    }

    // 3) Update password (in Auth) — with strong validation
    if (newPassword) {
      if (!isStrongPassword(newPassword)) {
        alert(
          "❌ Password must be at least 8 chars and include at least one number and one special character",
        );
        setSaving(false);
        return;
      }
      const { error: pwErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwErr) {
        alert(`❌ Failed to update password: ${pwErr.message}`);
        setSaving(false);
        return;
      }
      setNewPassword("");
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
        <p className="text-xs opacity-60">
          Changing email may require confirmation depending on your Supabase
          Auth settings.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">New password</label>
        <input
          className="border rounded px-3 py-2 w-full"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-xs opacity-60">
          Leave blank to keep your current password. Must be ≥ 8 chars, include
          one number and one special character.
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
