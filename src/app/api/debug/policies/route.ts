import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  // read active policies for the two tables
  // const { data, error } = await supabaseAdmin.rpc("pg_policies", {}).select?.; // ignore, we’ll use SQL instead
  // simpler: run raw SQL through admin client
  const { data: policies, error: err } = await supabaseAdmin
    .from("pg_policies" as any)
    .select("policyname, tablename, cmd, qual, with_check")
    .in("tablename", ["households", "household_members"]);

  if (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, policies });
}
