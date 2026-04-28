import { Octokit } from "@octokit/rest";
import { loadEnvConfig } from "../config";
import type { ComparePreview, NormalizedTokenDocument } from "../../shared/types";

export interface CreateTokenPrInput {
  baseBranch: string;
  preview: ComparePreview;
  updatedDocument: NormalizedTokenDocument;
  commitMessage: string;
}

export interface CreateTokenPrResult {
  prUrl: string;
  newBranch: string;
  commitSha?: string;
}

function buildPrBody(preview: ComparePreview): string {
  const lines: string[] = [];
  lines.push("## Simple explanation (for designers)");
  lines.push(
    "This PR proposes design-token updates detected in Figma variables. Please verify that all intended design changes are captured and no accidental drift is included."
  );
  lines.push("");
  lines.push("## Technical explanation (for developers)");
  lines.push(
    "Updates normalized token source (tokens/source/tokens.json) based on Figma variable comparison. Changes were classified by risk before proposal."
  );
  lines.push("");
  lines.push("## Token diff table");
  lines.push("| Token | Type | Change | Risk | Mode |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const change of preview.changes) {
    lines.push(
      `| ${change.token} | ${change.group} | ${change.type} | ${change.risk} | ${change.affectedMode || "-"} |`
    );
  }
  lines.push("");
  lines.push("## Risk level");
  lines.push(
    preview.totals.breaking > 0
      ? "**High** - breaking changes present"
      : preview.totals.reviewNeeded > 0
        ? "**Medium** - review-needed changes present"
        : "**Low** - safe additive changes"
  );
  lines.push("");
  lines.push("## Approval checklist");
  lines.push("- [ ] Designer confirmed intent of changes");
  lines.push("- [ ] Design system owner validated naming/structure");
  lines.push("- [ ] Engineer confirmed no unintended visual regressions");
  lines.push("- [ ] Breaking changes resolved or explicitly approved");
  lines.push("- [ ] Figma source file matches policy allow-list");
  return lines.join("\n");
}

export async function createTokenChangePr(input: CreateTokenPrInput): Promise<CreateTokenPrResult> {
  const env = loadEnvConfig();
  const newBranchName = `token-sync/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const commitMessage = input.commitMessage.trim();

  if (!env.githubToken || !env.githubOwner || !env.githubRepo) {
    throw new Error(
      `GitHub live mode requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO. Missing: ${env.missing.join(", ")}`
    );
  }

  const octokit = new Octokit({ auth: env.githubToken });
  const owner = env.githubOwner;
  const repo = env.githubRepo;
  const basePath = env.githubTokenFilePath;

  const baseRef = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${input.baseBranch}`
  });

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranchName}`,
    sha: baseRef.data.object.sha
  });

  let fileSha: string | undefined;
  try {
    const existing = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: basePath,
      ref: newBranchName
    });
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      fileSha = existing.data.sha;
    }
  } catch {
    fileSha = undefined;
  }

  const updatedContent = `${JSON.stringify(input.updatedDocument, null, 2)}\n`;
  const commit = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: basePath,
    message: commitMessage,
    content: Buffer.from(updatedContent, "utf8").toString("base64"),
    branch: newBranchName,
    sha: fileSha
  });

  const pr = await octokit.rest.pulls.create({
    owner,
    repo,
    head: newBranchName,
    base: input.baseBranch,
    title: commitMessage,
    body: buildPrBody(input.preview)
  });

  return {
    prUrl: pr.data.html_url,
    newBranch: newBranchName,
    commitSha: commit.data.commit.sha || undefined
  };
}
