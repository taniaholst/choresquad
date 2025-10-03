"use client";
import { useState } from "react";
import { saveProfile } from "@/actions/profiles";

export default function DisplayNameForm({
  userId,
  welcomeFlag,
  setDisplayName,
  setToastMsg,
}: {
  userId: string;
  welcomeFlag?: string | null;
  setDisplayName: (name: string) => void;
  setToastMsg: (msg: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  async function handleSaveProfile(name: string) {
    if (!userId) return;
    setStatus("saving");
    const ok = await saveProfile(userId, name);
    if (!ok) {
      setToastMsg("❌ Failed to save profile");
      setStatus("idle");
      return;
    }
    setDisplayName(name);
    setToastMsg("🎉 Profile saved");
    setStatus("idle");
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
        onClick={() => handleSaveProfile(name)}
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
