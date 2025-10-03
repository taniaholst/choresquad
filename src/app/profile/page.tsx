"use client";
import ProfileForm from "@/components/profile/ProfileForm";
import DeleteAccount from "@/components/profile/DeleteAccount";

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-md p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Your Profile</h1>
      <ProfileForm />
      <DeleteAccount />
    </main>
  );
}
