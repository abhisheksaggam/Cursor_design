import { loadEnvConfig } from "@/lib/config";

export interface BranchInfo {
  name: string;
  protected: boolean;
  sha: string;
}

const FIXTURE_BRANCHES: BranchInfo[] = [
  { name: "main", protected: true, sha: "fixture-main-sha" },
  { name: "develop", protected: false, sha: "fixture-develop-sha" },
  { name: "design-tokens/staging", protected: false, sha: "fixture-staging-sha" }
];

export async function fetchBranches(): Promise<{ demoMode: boolean; branches: BranchInfo[] }> {
  const env = loadEnvConfig();
  if (env.demoMode || !env.githubToken || !env.githubOwner || !env.githubRepo) {
    return { demoMode: true, branches: FIXTURE_BRANCHES };
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
    demoMode: false,
    branches: data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      sha: branch.commit.sha
    }))
  };
}
