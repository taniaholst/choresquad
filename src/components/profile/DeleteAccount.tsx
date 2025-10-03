// src/components/profile/DeleteAccount.tsx
"use client";
export default function DeleteAccount() {
  async function handleDelete() {
    if (!confirm("⚠️ This will permanently delete your account. Continue?"))
      return;

    const res = await fetch("/api/delete-account", { method: "POST" });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(`❌ Failed to delete account: ${json.error ?? "Unknown error"}`);
      return;
    }

    // success → bounce to home
    window.location.href = "/";
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <h2 className="font-medium text-red-600">Danger zone</h2>
      <button
        onClick={handleDelete}
        className="border rounded px-4 py-2 w-full text-red-600"
      >
        Delete account
      </button>
      <p className="text-xs opacity-70">
        This permanently deletes your auth user and profile.
      </p>
    </div>
  );
}
