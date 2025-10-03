"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfileEditor({
  userId,
  displayName,
  onSaved,
  setToastMsg,
}: {
  userId: string;
  displayName: string;
  onSaved?: (newName: string) => void;
  setToastMsg?: (msg: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setToastMsg?.(`❌ Failed to update name: ${error.message}`);
      return;
    }
    onSaved?.(name);
    setToastMsg?.("🎉 Name updated");
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="text-sm opacity-80 cursor-pointer"
        onClick={() => {
          setValue(displayName);
          setEditing(true);
        }}
        title="Edit your display name"
      >
        👋 {displayName}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        disabled={saving}
      />
      <button
        className="text-xs underline"
        type="submit"
        disabled={saving || !value.trim()}
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        className="text-xs underline text-gray-500"
        onClick={() => setEditing(false)}
        disabled={saving}
      >
        Cancel
      </button>
    </form>
  );
}
