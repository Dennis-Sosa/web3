import { NextResponse } from "next/server";
import { loadQaFromLibraryNotes } from "@/lib/library/qa";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await loadQaFromLibraryNotes();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Server error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

