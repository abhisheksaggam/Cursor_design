import { loadEnvConfig } from "../config";

export interface BranchInfo {
  name: string;
  protected: boolean;
  sha: string;
}

export async function fetchBranches(): Promise<{ branches: BranchInfo[] }> {
  const env = loadEnvConfig();
  if (!env.githubLive || !env.githubToken || !env.githubOwner || !env.githubRepo) {
    throw new Error(
      `GitHub live mode requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO. Missing: ${env.missing.join(", ")}`
    );
  }

  const url = `https://api.github.com/repos/${env.githubOwner}/${env.githubRepo}/branches?per_page=100`;
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
  const data = (await response.json()) as Array<{
    name: string;
    protected: boolean;
    commit: { sha: string };
  }>;

  return {
    branches: data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      sha: branch.commit.sha
    }))
  };
}
