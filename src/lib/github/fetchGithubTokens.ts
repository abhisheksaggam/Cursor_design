import { loadEnvConfig } from "../config.js";
import type { NormalizedTokenDocument } from "../../shared/types";

export async function fetchGithubTokens(): Promise<{
  document: NormalizedTokenDocument;
  sha?: string;
}> {
  const env = loadEnvConfig();
  if (!env.githubLive || !env.githubToken || !env.githubOwner || !env.githubRepo) {
    throw new Error(
      `GitHub live mode requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO. Missing: ${env.missing.join(", ")}`
    );
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
  return { document, sha: data.sha };
}
