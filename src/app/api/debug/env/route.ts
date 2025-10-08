import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const ref = url.match(/^https:\/\/([^.]+)\./)?.[1] ?? "unknown";
  return NextResponse.json({
    projectRefTail: ref.slice(-6),
    vercelEnv: process.env.VERCEL_ENV, // production/preview/development
  });
}
