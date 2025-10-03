// middleware.ts (project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>(["/"]);

export const config = {
  // run on everything except Next internals, files, and API (we allow API by default)
  matcher: ["/((?!_next|.*\\..*).*)"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow public routes
  if (PUBLIC_PATHS.has(pathname) || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // allow API routes without forcing a redirect (they should auth-check themselves)
  if (pathname.startsWith("/api")) return NextResponse.next();

  // cookie-based session presence
  const hasSession =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("sb-refresh-token")?.value;

  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}
