import { NextResponse } from "next/server";
import { connection } from "next/server";

// Simple liveness endpoint with dynamic request-time timestamp
export async function GET() {
  await connection();
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
