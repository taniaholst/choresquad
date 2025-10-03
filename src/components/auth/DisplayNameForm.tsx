"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DisplayNameForm({
  userId,
  welcomeFlag,
  onSaved,
}: {
  userId: string;
  welcomeFlag?: string | null;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  async function saveProfile() {
    if (!userId || !name.trim()) return;
    setStatus("saving");
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: name.trim(),
    });
    if (error) {
      alert(error.message);
      setStatus("idle");
      return;
    }
    onSaved(name.trim());
  }

  return (
    <div className="border rounded p-4 space-y-3">
      {welcomeFlag && (
        <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
          ✅ You’re signed in.
        </div>
      )}
      <label className="text-sm font-medium">Choose your display name</label>
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
  );
}
