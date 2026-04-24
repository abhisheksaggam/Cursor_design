import { NextResponse } from "next/server";
import { createTokenChangePr } from "@/lib/github/createTokenChangePr";
import type { ComparePreview, NormalizedTokenDocument } from "@/lib/types";

interface CreatePrRequest {
  baseBranch: string;
  preview: ComparePreview;
  updatedDocument: NormalizedTokenDocument;
  prTitle?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePrRequest;
    if (!body?.baseBranch || !body?.updatedDocument || !body?.preview) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    const result = await createTokenChangePr(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
