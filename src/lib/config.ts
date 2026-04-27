export const ALLOWED_FIGMA_SOURCE_FILE =
  "https://www.figma.com/design/zFN780oP27DS6zOAhdRSU7/Cursor?node-id=1-777&t=JDkt7LLCh9P0uIBS-1";

export interface EnvConfig {
  figmaAccessToken: string | null;
  figmaFileKey: string | null;
  githubToken: string | null;
  githubOwner: string | null;
  githubRepo: string | null;
  githubTokenFilePath: string;
  demoMode: boolean;
  missing: string[];
}

export function loadEnvConfig(): EnvConfig {
  const figmaAccessToken = process.env.FIGMA_ACCESS_TOKEN || null;
  const figmaFileKey = process.env.FIGMA_FILE_KEY || null;
  const githubToken = process.env.GITHUB_TOKEN || null;
  const githubOwner = process.env.GITHUB_OWNER || null;
  const githubRepo = process.env.GITHUB_REPO || null;
  const githubTokenFilePath = process.env.GITHUB_TOKEN_FILE_PATH || "tokens/source/tokens.json";

  const missing: string[] = [];
  if (!figmaAccessToken) missing.push("FIGMA_ACCESS_TOKEN");
  if (!figmaFileKey) missing.push("FIGMA_FILE_KEY");
  if (!githubToken) missing.push("GITHUB_TOKEN");
  if (!githubOwner) missing.push("GITHUB_OWNER");
  if (!githubRepo) missing.push("GITHUB_REPO");

  const demoMode = missing.length > 0;

  return {
    figmaAccessToken,
    figmaFileKey,
    githubToken,
    githubOwner,
    githubRepo,
    githubTokenFilePath,
    demoMode,
    missing
  };
}

export function assertAllowedFigmaSourceFile(url: string | null | undefined) {
  if (url !== ALLOWED_FIGMA_SOURCE_FILE) {
    throw new Error(
      `Blocked by policy: only this Figma file is allowed: ${ALLOWED_FIGMA_SOURCE_FILE}`
    );
  }
}
