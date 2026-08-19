import { NextResponse } from "next/server";
import { disconnectLinkedIn } from "@/lib/linkedin/client";

export async function POST() {
  await disconnectLinkedIn();
  return NextResponse.json({ ok: true });
}
