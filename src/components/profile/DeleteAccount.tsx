"use client";
import { supabase } from "@/lib/supabase";

export default function DeleteAccount() {
  async function handleDelete() {
    if (!confirm("⚠️ This will permanently delete your account. Continue?"))
      return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Delete profile row
    await supabase.from("profiles").delete().eq("id", user.id);

    // For full user deletion, we need a server action with SERVICE_ROLE
    // Here we just sign them out after deleting their profile row
    await supabase.auth.signOut();
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
        This deletes your profile row and logs you out. To fully remove your
        auth user, implement a secure server action with the service role.
      </p>
    </div>
  );
}
