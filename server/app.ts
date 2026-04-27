import cors from "cors";
import express, { type Request, type Response } from "express";
import { ALLOWED_FIGMA_SOURCE_FILE, assertAllowedFigmaSourceFile, loadEnvConfig } from "../src/lib/config";
import { fetchFigmaVariables } from "../src/lib/figma/fetchFigmaVariables";
import { normalizeFigmaVariables } from "../src/lib/figma/normalizeFigmaVariables";
import { createTokenChangePr } from "../src/lib/github/createTokenChangePr";
import { fetchBranches } from "../src/lib/github/fetchBranches";
import { fetchGithubTokens } from "../src/lib/github/fetchGithubTokens";
import { compareTokens } from "../src/lib/tokens/compareTokens";
import { generatePreview } from "../src/lib/tokens/generatePreview";
import { normalizeGithubTokens } from "../src/lib/tokens/normalizeGithubTokens";
import type { ComparePreview, NormalizedTokenDocument } from "../src/shared/types";

const app = express();

app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:4200" }));
app.use(express.json({ limit: "5mb" }));

function sendError(response: Response, error: unknown, status = 500) {
  response.status(status).json({ error: error instanceof Error ? error.message : "Unknown error" });
}

app.get("/api/health", (_request, response) => {
  const env = loadEnvConfig();
  response.json({
    ok: true,
    figmaLive: env.figmaLive,
    githubLive: env.githubLive,
    figmaSourceFile: ALLOWED_FIGMA_SOURCE_FILE
  });
});

app.get("/api/figma/variables", async (_request, response) => {
  try {
    const result = await fetchFigmaVariables();
    assertAllowedFigmaSourceFile(result.figmaSourceFile);
    const normalized = normalizeFigmaVariables(result.collections);
    response.json({
      figmaSourceFile: result.figmaSourceFile,
      normalized
    });
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/github/tokens", async (_request, response) => {
  try {
    const result = await fetchGithubTokens();
    const normalized = normalizeGithubTokens(result.document);
    response.json({
      document: normalized,
      sha: result.sha || null
    });
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/github/branches", async (_request, response) => {
  try {
    response.json(await fetchBranches());
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/tokens/compare", async (_request, response) => {
  try {
    const [figmaRaw, githubRaw] = await Promise.all([fetchFigmaVariables(), fetchGithubTokens()]);
    assertAllowedFigmaSourceFile(figmaRaw.figmaSourceFile);

    const figmaDoc = normalizeFigmaVariables(figmaRaw.collections);
    const githubDoc = normalizeGithubTokens(githubRaw.document);
    const changes = compareTokens(githubDoc, figmaDoc);
    response.json(
      generatePreview({
        githubDoc,
        figmaDoc,
        changes
      })
    );
  } catch (error) {
    sendError(response, error);
  }
});

app.post(
  "/api/github/create-pr",
  async (
    request: Request<
      Record<string, never>,
      unknown,
      {
        baseBranch?: string;
        preview?: ComparePreview;
        updatedDocument?: NormalizedTokenDocument;
        prTitle?: string;
      }
    >,
    response
  ) => {
    try {
      const body = request.body;
      if (!body?.baseBranch || !body?.updatedDocument || !body?.preview) {
        response.status(400).json({ error: "Missing required fields." });
        return;
      }

      response.json(
        await createTokenChangePr({
          baseBranch: body.baseBranch,
          preview: body.preview,
          updatedDocument: body.updatedDocument,
          prTitle: body.prTitle
        })
      );
    } catch (error) {
      sendError(response, error);
    }
  }
);

export default app;
