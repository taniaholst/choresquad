// src/app/api/delete-account/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST() {
  // 1) Read the access token from Supabase auth cookies
  const jar = await cookies();
  const accessToken =
    jar.get("sb-access-token")?.value ?? jar.get("supabase-auth-token")?.value; // fallback if older helpers are used

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  // 2) Resolve current user from the token using Admin API
  const { data: userInfo, error: userErr } =
    await supabaseAdmin.auth.getUser(accessToken);

  if (userErr || !userInfo?.user) {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session" },
      { status: 401 },
    );
  }

  const userId = userInfo.user.id;

  // 3) Delete the profile row (tidy)
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  // 4) Delete the auth user (requires SERVICE ROLE)
  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (delErr) {
    return NextResponse.json(
      { ok: false, error: delErr.message },
      { status: 500 },
    );
  }

  // 5) Return success
  return NextResponse.json({ ok: true });
}
