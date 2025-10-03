import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✔️ loaded"
      : "❌ missing",
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "✔️ loaded"
      : "❌ missing",
  });
}
