import type {
  ChangeType,
  NormalizedToken,
  NormalizedTokenDocument,
  TokenChange,
  TokenGroup,
  TokenValue
} from "../../shared/types";
import { classifyRisk, explanations } from "./classifyTokenChange";

function flatten(doc: NormalizedTokenDocument): Record<string, NormalizedToken> {
  const flat: Record<string, NormalizedToken> = {};
  for (const [group, tokens] of Object.entries(doc.tokens || {}) as Array<
    [TokenGroup, Record<string, NormalizedToken>]
  >) {
    for (const [name, token] of Object.entries(tokens || {})) {
      flat[name] = { ...token, group, name };
    }
  }
  return flat;
}

function sameValue(a: TokenValue, b: TokenValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sameModes(
  a: Record<string, TokenValue> | undefined,
  b: Record<string, TokenValue> | undefined
): boolean {
  return JSON.stringify(a || null) === JSON.stringify(b || null);
}

function makeChange(
  github: NormalizedToken | undefined,
  figma: NormalizedToken | undefined,
  type: ChangeType,
  options: { affectedMode?: string | null } = {}
): TokenChange {
  const token = (figma?.name || github?.name) as string;
  const group = (figma?.group || github?.group) as TokenGroup;
  const risk = classifyRisk(type);
  const { designer, developer, note } = explanations(type, token);
  return {
    token,
    group,
    type,
    risk,
    affectedMode: options.affectedMode ?? null,
    githubValue: github?.value,
    figmaValue: figma?.value,
    note,
    designerExplanation: designer,
    developerExplanation: developer
  };
}

export function compareTokens(
  github: NormalizedTokenDocument,
  figma: NormalizedTokenDocument
): TokenChange[] {
  const githubFlat = flatten(github);
  const figmaFlat = flatten(figma);
  const changes: TokenChange[] = [];

  const githubKeys = new Set(Object.keys(githubFlat));
  const figmaKeys = new Set(Object.keys(figmaFlat));

  const onlyInFigma = [...figmaKeys].filter((k) => !githubKeys.has(k));
  const onlyInGithub = [...githubKeys].filter((k) => !figmaKeys.has(k));
  const inBoth = [...githubKeys].filter((k) => figmaKeys.has(k));

  const usedRenamedFigma = new Set<string>();
  const usedRenamedGithub = new Set<string>();
  for (const gKey of onlyInGithub) {
    for (const fKey of onlyInFigma) {
      if (usedRenamedFigma.has(fKey) || usedRenamedGithub.has(gKey)) continue;
      if (sameValue(githubFlat[gKey].value, figmaFlat[fKey].value)) {
        changes.push(
          makeChange(githubFlat[gKey], figmaFlat[fKey], "rename-candidate", {
            affectedMode: null
          })
        );
        usedRenamedFigma.add(fKey);
        usedRenamedGithub.add(gKey);
      }
    }
  }

  for (const key of onlyInFigma) {
    if (usedRenamedFigma.has(key)) continue;
    changes.push(makeChange(undefined, figmaFlat[key], "added"));
  }

  for (const key of onlyInGithub) {
    if (usedRenamedGithub.has(key)) continue;
    changes.push(makeChange(githubFlat[key], undefined, "removed"));
  }

  for (const key of inBoth) {
    const g = githubFlat[key];
    const f = figmaFlat[key];

    if ((g.type || null) !== (f.type || null) && g.type && f.type) {
      changes.push(makeChange(g, f, "type-change"));
      continue;
    }

    if (!sameValue(g.value, f.value)) {
      changes.push(makeChange(g, f, "value-change"));
    }

    if (!sameModes(g.modes, f.modes)) {
      if (g.modes && f.modes) {
        const missing = Object.keys(g.modes).filter((m) => !(m in f.modes!));
        if (missing.length > 0) {
          for (const mode of missing) {
            changes.push(makeChange(g, f, "missing-mode", { affectedMode: mode }));
          }
        } else {
          changes.push(makeChange(g, f, "mode-change"));
        }
      } else {
        changes.push(makeChange(g, f, "mode-change"));
      }
    }

    if ((g.description || "") !== (f.description || "") && sameValue(g.value, f.value)) {
      changes.push(makeChange(g, f, "description-change"));
    }
  }

  return changes;
}
