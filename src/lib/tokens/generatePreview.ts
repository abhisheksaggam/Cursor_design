import type { ComparePreview, NormalizedTokenDocument, TokenChange } from "../../shared/types";

export function generatePreview(params: {
  githubDoc: NormalizedTokenDocument;
  figmaDoc: NormalizedTokenDocument;
  changes: TokenChange[];
}): ComparePreview {
  const { githubDoc, figmaDoc, changes } = params;

  const totals = {
    total: changes.length,
    safe: changes.filter((c) => c.risk === "safe").length,
    reviewNeeded: changes.filter((c) => c.risk === "review-needed").length,
    breaking: changes.filter((c) => c.risk === "breaking").length
  };

  const proposedSource = buildProposedSource(githubDoc, figmaDoc, changes);

  return {
    figmaSourceFile: figmaDoc.figmaSourceFile,
    totals,
    changes,
    proposedSource
  };
}

function buildProposedSource(
  github: NormalizedTokenDocument,
  figma: NormalizedTokenDocument,
  changes: TokenChange[]
): NormalizedTokenDocument {
  const next: NormalizedTokenDocument = JSON.parse(JSON.stringify(github));
  next.generatedAt = new Date().toISOString();
  next.externalInput = figma.externalInput;
  next.figmaSourceFile = figma.figmaSourceFile;

  for (const change of changes) {
    const group = change.group;
    const name = change.token;
    if (change.type === "added") {
      const token = figma.tokens[group]?.[name];
      if (token) next.tokens[group][name] = token;
    } else if (change.type === "value-change" || change.type === "alias-change") {
      const token = figma.tokens[group]?.[name];
      if (token && next.tokens[group][name]) {
        next.tokens[group][name] = {
          ...next.tokens[group][name],
          value: token.value
        };
      }
    } else if (change.type === "description-change") {
      const token = figma.tokens[group]?.[name];
      if (token && next.tokens[group][name]) {
        next.tokens[group][name] = {
          ...next.tokens[group][name],
          description: token.description
        };
      }
    } else if (change.type === "mode-change") {
      const token = figma.tokens[group]?.[name];
      if (token && next.tokens[group][name]) {
        next.tokens[group][name] = {
          ...next.tokens[group][name],
          modes: token.modes
        };
      }
    }
  }

  return next;
}
