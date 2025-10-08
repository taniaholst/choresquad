"use client";
import { useState } from "react";

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
  onRename,
}: {
  name: string;
  households: Household[];
  onCreate: (name: string) => void | Promise<void>;
  onInvite: (code: string) => void;
  onRename: (id: string, name: string) => void | Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | "create" | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSavingId("create");
    await onCreate(newName.trim());
    setNewName("");
    setCreating(false);
    setSavingId(null);
  }

  async function handleRename(id: string) {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    setSavingId(id);
    await onRename(id, editName.trim());
    setEditingId(null);
    setSavingId(null);
  }

  const CreateBlock = (
    <div className="border rounded p-3 space-y-2">
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="border rounded px-4 py-2 w-full"
        >
          Create household
        </button>
      ) : (
        <div className="space-y-2">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Enter household name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || savingId === "create"}
              className="border rounded px-4 py-2 flex-1"
            >
              {savingId === "create" ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="border rounded px-4 py-2 flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (households.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm">
          👋 {name}, you don’t have a household yet.
        </div>
        {CreateBlock}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm">👋 {name}, here are your households:</div>
      <ul className="space-y-3">
        {households.map((h) => {
          const isEditing = editingId === h.id;
          return (
            <li key={h.id} className="border rounded p-3 space-y-2">
              {!isEditing ? (
                <div
                  className="font-medium active:opacity-80"
                  onClick={() => {
                    // tap name to start editing (mobile-friendly)
                    setEditingId(h.id);
                    setEditName(h.name);
                  }}
                >
                  {h.name}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="border rounded px-3 py-2 flex-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(h.id)}
                    disabled={savingId === h.id || !editName.trim()}
                    className="border rounded px-3 py-2"
                  >
                    {savingId === h.id ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditName("");
                    }}
                    className="border rounded px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="text-xs opacity-70">
                Invite code: <code>{h.invite_code}</code>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setEditingId(h.id);
                    setEditName(h.name);
                  }}
                  className="border rounded px-3 py-1 text-sm"
                >
                  Edit household name
                </button>
                <button
                  onClick={() => location.assign(`/households/${h.id}`)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  Show chores
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {CreateBlock}
    </div>
  );
}
