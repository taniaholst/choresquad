"use client";
import { useState } from "react";
import SignupForm from "./SignUpForm";
import SigninForm from "./SignInForm";

export default function AuthTabs({
  setToastMsg,
}: {
  setToastMsg?: (m: string | null) => void;
}) {
  const [tab, setTab] = useState<"signup" | "signin">("signup");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("signup")}
          className={`border rounded px-3 py-2 ${tab === "signup" ? "bg-black text-white" : ""}`}
        >
          Sign up
        </button>
        <button
          onClick={() => setTab("signin")}
          className={`border rounded px-3 py-2 ${tab === "signin" ? "bg-black text-white" : ""}`}
        >
          Sign in
        </button>
      </div>
      {tab === "signup" ? (
        <SignupForm setToastMsg={setToastMsg} />
      ) : (
        <SigninForm setToastMsg={setToastMsg} />
      )}
    </div>
  );
}
