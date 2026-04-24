import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@/lib/config";
import type { NormalizedTokenDocument } from "@/lib/types";

async function loadLocalSource(): Promise<NormalizedTokenDocument> {
  const p = path.join(process.cwd(), "tokens/source/tokens.json");
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as NormalizedTokenDocument;
}

export async function fetchGithubTokens(): Promise<{
  demoMode: boolean;
  document: NormalizedTokenDocument;
  sha?: string;
}> {
  const env = loadEnvConfig();
  if (env.demoMode || !env.githubToken || !env.githubOwner || !env.githubRepo) {
    const document = await loadLocalSource();
    return { demoMode: true, document };
  }

  const url = `https://api.github.com/repos/${env.githubOwner}/${env.githubRepo}/contents/${encodeURIComponent(
    env.githubTokenFilePath
  )}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
  }
  const data = (await response.json()) as { content: string; encoding: string; sha: string };
  const decoded = Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8");
  const document = JSON.parse(decoded) as NormalizedTokenDocument;
  return { demoMode: false, document, sha: data.sha };
}
