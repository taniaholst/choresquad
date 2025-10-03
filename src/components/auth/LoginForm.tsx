"use client";
import { useState } from "react";
import { sendMagicLink } from "@/actions/auth";

export default function LoginForm({
  setToastMsg,
}: {
  setToastMsg?: (msg: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "sending">("idle");

  async function onSend() {
    setStatus("sending");
    const redirectTo = `${location.origin}/?welcome=1`;
    const res = await sendMagicLink(email, redirectTo);
    if (!res.ok) {
      setStatus("idle");
      setToastMsg?.(`❌ ${res.error}`);
      return;
    }
    setStatus("sent");
    setToastMsg?.("📬 Magic link sent");
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
        onClick={onSend}
        className="border rounded px-4 py-2 w-full"
        disabled={!email || status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {status === "sent" && (
        <div className="text-xs text-green-700">
          Email sent—check your inbox.
        </div>
      )}
    </div>
  );
}
