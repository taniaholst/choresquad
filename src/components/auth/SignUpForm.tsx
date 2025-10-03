"use client";
import { useState } from "react";
import { sendMagicLink } from "@/actions/auth";

export default function SignupForm({
  setToastMsg,
}: {
  setToastMsg?: (m: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

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
    <form
      className="space-y-3 border rounded p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSend();
      }}
    >
      <label className="text-sm font-medium">Sign up with magic link</label>
      <input
        className="border rounded px-3 py-2 w-full"
        type="email"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        className="border rounded px-4 py-2 w-full"
        disabled={!email || status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      <p className="text-xs opacity-60">
        Tip: if the magic link opens on a different device, just come back to
        this page after clicking it—your session will be active here too.
      </p>
      {status === "sent" && (
        <div className="text-xs text-green-700">
          Email sent—check your inbox.
        </div>
      )}
    </form>
  );
}
