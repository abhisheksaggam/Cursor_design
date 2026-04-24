import { NextResponse } from "next/server";
import { fetchBranches } from "@/lib/github/fetchBranches";

export async function GET() {
  try {
    const result = await fetchBranches();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
