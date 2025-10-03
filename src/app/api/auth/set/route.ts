import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Payload = {
  event:
    | "SIGNED_IN"
    | "SIGNED_OUT"
    | "TOKEN_REFRESHED"
    | "PASSWORD_RECOVERY"
    | "USER_UPDATED";
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number; // seconds
  } | null;
};

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const { event, session } = (await req.json()) as Payload;

  // conservative defaults if Supabase doesn't send expires_in
  const accessMaxAge = session?.expires_in ?? 60 * 60; // 1h
  const refreshMaxAge = 60 * 60 * 24 * 30; // 30d

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (session?.access_token && session?.refresh_token) {
      res.cookies.set("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: accessMaxAge,
      });
      res.cookies.set("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: refreshMaxAge,
      });
    }
  } else if (event === "SIGNED_OUT") {
    // clear both cookies
    res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
    res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
  }

  return res;
}
