import { NextResponse } from "next/server";
import { dbEngine } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, db: dbEngine() });
}
