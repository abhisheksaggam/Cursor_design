import type { NormalizedTokenDocument } from "@/lib/types";

export function normalizeGithubTokens(document: NormalizedTokenDocument): NormalizedTokenDocument {
  const groups: NormalizedTokenDocument["tokens"] = {
    color: {},
    spacing: {},
    typography: {},
    radius: {},
    shadow: {}
  };

  for (const [group, tokens] of Object.entries(document.tokens || {}) as Array<
    [keyof NormalizedTokenDocument["tokens"], NormalizedTokenDocument["tokens"][keyof NormalizedTokenDocument["tokens"]]]
  >) {
    for (const [name, token] of Object.entries(tokens || {})) {
      groups[group][name] = {
        ...token,
        group,
        name,
        owner: token.owner || "design-system",
        deprecated: token.deprecated || false,
        replacement: token.replacement ?? null
      };
    }
  }

  return {
    ...document,
    tokens: groups
  };
}
