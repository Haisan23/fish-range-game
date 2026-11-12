import { NextResponse } from "next/server";
import { connectDB, mongoEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health -> shows which storage is active and whether MongoDB connects.
export async function GET() {
  if (!mongoEnabled()) {
    return NextResponse.json({ backend: "json-file", connected: true, note: "MONGODB_URI is not set" });
  }
  try {
    const m = await connectDB();
    return NextResponse.json({ backend: "mongodb", connected: true, database: m.connection.name });
  } catch (err) {
    return NextResponse.json(
      { backend: "mongodb", connected: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 503 }
    );
  }
}