"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Household = {
  id: string;
  name: string;
  invite_code: string;
};

export default function HouseholdList({
  name,
  households,
  onCreate,
  onInvite,
}: {
  name: string;
  households: Household[];
  onCreate: () => void;
  onInvite: (code: string) => void;
}) {
  const router = useRouter();

  if (households.length === 0) {
    return (
      <div className="border rounded p-4 space-y-3">
        <div className="text-sm">
          👋 {name}, you don’t have a household yet.
        </div>
        <button onClick={onCreate} className="border rounded px-4 py-2 w-full">
          Create household
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 space-y-4">
      <div className="text-sm">👋 {name}, here are your households:</div>
      <ul className="space-y-3">
        {households.map((h) => (
          <li key={h.id} className="border rounded p-3 space-y-2">
            <div className="font-medium">{h.name}</div>
            <div className="text-xs opacity-70">
              Invite code: <code>{h.invite_code}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onInvite(h.invite_code)}
                className="border rounded px-3 py-1 text-sm"
              >
                Invite people
              </button>
              <button
                onClick={() => router.push(`/households/${h.id}`)}
                className="border rounded px-3 py-1 text-sm"
              >
                Show chores
              </button>
              <button
                onClick={() => router.push(`/households/${h.id}`)}
                className="border rounded px-3 py-1 text-sm"
              >
                Add chore
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={onCreate} className="border rounded px-4 py-2 w-full">
        + Create another household
      </button>
    </div>
  );
}
