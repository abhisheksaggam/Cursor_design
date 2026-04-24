import { NextResponse } from "next/server";
import { fetchFigmaVariables } from "@/lib/figma/fetchFigmaVariables";
import { normalizeFigmaVariables } from "@/lib/figma/normalizeFigmaVariables";
import { fetchGithubTokens } from "@/lib/github/fetchGithubTokens";
import { normalizeGithubTokens } from "@/lib/tokens/normalizeGithubTokens";
import { compareTokens } from "@/lib/tokens/compareTokens";
import { generatePreview } from "@/lib/tokens/generatePreview";
import { assertAllowedFigmaSourceFile } from "@/lib/config";

export async function POST() {
  try {
    const [figmaRaw, githubRaw] = await Promise.all([fetchFigmaVariables(), fetchGithubTokens()]);
    assertAllowedFigmaSourceFile(figmaRaw.figmaSourceFile);

    const figmaDoc = normalizeFigmaVariables(figmaRaw.collections);
    const githubDoc = normalizeGithubTokens(githubRaw.document);
    const changes = compareTokens(githubDoc, figmaDoc);
    const preview = generatePreview({
      demoMode: figmaRaw.demoMode || githubRaw.demoMode,
      githubDoc,
      figmaDoc,
      changes
    });
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
