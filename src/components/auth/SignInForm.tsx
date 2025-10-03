"use client";
import { useState } from "react";
import { signInWithPassword } from "@/actions/auth";

export default function SigninForm({
  setToastMsg,
}: {
  setToastMsg?: (m: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "signing">("idle");

  async function onSignIn() {
    setStatus("signing");
    const res = await signInWithPassword(email, password);
    if (!res.ok) {
      setStatus("idle");
      setToastMsg?.(`❌ ${res.error ?? "Invalid email or password"}`);
      return;
    }
    setToastMsg?.("✅ Signed in");
  }

  return (
    <form
      className="space-y-3 border rounded p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSignIn();
      }}
    >
      <label className="text-sm font-medium">Sign in</label>
      <input
        className="border rounded px-3 py-2 w-full"
        type="email"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 w-full"
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="border rounded px-4 py-2 w-full"
        disabled={!email || !password || status === "signing"}
      >
        {status === "signing" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
