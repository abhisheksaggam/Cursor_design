import { NextResponse } from "next/server";
import { fetchGithubTokens } from "@/lib/github/fetchGithubTokens";
import { normalizeGithubTokens } from "@/lib/tokens/normalizeGithubTokens";

export async function GET() {
  try {
    const result = await fetchGithubTokens();
    const normalized = normalizeGithubTokens(result.document);
    return NextResponse.json({
      demoMode: result.demoMode,
      document: normalized,
      sha: result.sha || null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
