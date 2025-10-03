"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  async function sendMagicLink() {
    const emailRedirectTo = `${location.origin}/?welcome=1`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    if (error) return alert(error.message);
    setStatus("sent");
  }

  return (
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
  );
}
