import { NextResponse } from "next/server";
import { fetchFigmaVariables } from "@/lib/figma/fetchFigmaVariables";
import { normalizeFigmaVariables } from "@/lib/figma/normalizeFigmaVariables";
import { assertAllowedFigmaSourceFile } from "@/lib/config";

export async function GET() {
  try {
    const result = await fetchFigmaVariables();
    assertAllowedFigmaSourceFile(result.figmaSourceFile);
    const normalized = normalizeFigmaVariables(result.collections);
    return NextResponse.json({
      demoMode: result.demoMode,
      figmaSourceFile: result.figmaSourceFile,
      normalized
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
