import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>(["/"]);

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|txt|json)$/)
  ) {
    return NextResponse.next();
  }

  const hasSession =
    req.cookies.get("sb-access-token") || req.cookies.get("sb-refresh-token");

  if (hasSession) return NextResponse.next();
  if (PUBLIC_PATHS.has(path)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}
