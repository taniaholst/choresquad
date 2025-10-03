import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/"]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  if (
    PUBLIC_PATHS.has(path) ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // check Supabase session cookie (lightweight heuristic)
  const hasSession =
    req.cookies.get("sb-access-token") ||
    req.cookies.get("sb:token") ||
    req.cookies.get("supabase-auth-token");

  if (!hasSession) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
