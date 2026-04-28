import { readFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_FIGMA_SOURCE_FILE, loadEnvConfig } from "../config.js";
import type { NormalizedTokenDocument, TokenGroup, TokenValue } from "../../shared/types";

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: Record<string, string>;
  variables: FigmaVariable[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  description?: string;
  type: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN" | string;
  valuesByMode?: Record<string, unknown>;
  resolvedValuesByMode?: Record<string, { resolvedValue: unknown; alias?: string | null }>;
}

export interface FigmaVariablesResponse {
  figmaSourceFile: string;
  collections: FigmaVariableCollection[];
}

interface DemoDriftOverrides {
  overrides: Record<
    string,
    {
      rename?: Record<string, string>;
      add?: FigmaVariable[];
      remove?: string[];
      valueChanges?: Record<string, Record<string, unknown>>;
      modeMismatch?: Record<string, Record<string, unknown>>;
    }
  >;
}

async function loadBridgeCollections(): Promise<FigmaVariableCollection[] | null> {
  const root = process.cwd();
  try {
    const raw = await readFile(path.join(root, "fixtures/figma/bridge-collections.json"), "utf8");
    const parsed = JSON.parse(raw) as { collections?: FigmaVariableCollection[] };
    return Array.isArray(parsed.collections) && parsed.collections.length > 0 ? parsed.collections : null;
  } catch {
    return null;
  }
}

async function loadFixtureCollections(): Promise<FigmaVariableCollection[]> {
  const root = process.cwd();
  const bridge = await loadBridgeCollections();
  if (bridge) return bridge;
  try {
    const normalizedRaw = await readFile(path.join(root, "fixtures/figma/variables-export.json"), "utf8");
    const normalized = JSON.parse(normalizedRaw) as NormalizedTokenDocument;
    return normalizedDocumentToCollections(normalized);
  } catch {
    // Fall through to the legacy collection fixtures if a normalized fixture is unavailable.
  }

  const files = ["Colours.json", "Spacing.json", "Typography.json"];
  const collections: FigmaVariableCollection[] = [];
  for (const file of files) {
    const p = path.join(root, "tokens/input", file);
    const raw = await readFile(p, "utf8");
    collections.push(JSON.parse(raw) as FigmaVariableCollection);
  }

  try {
    const driftRaw = await readFile(path.join(root, "fixtures/figma/demo-drift.json"), "utf8");
    const drift = JSON.parse(driftRaw) as DemoDriftOverrides;
    for (const collection of collections) {
      const override = drift.overrides[collection.name];
      if (!override) continue;

      if (override.rename) {
        for (const variable of collection.variables) {
          const newName = override.rename[variable.name];
          if (newName) variable.name = newName;
        }
      }

      if (override.remove) {
        collection.variables = collection.variables.filter(
          (variable) => !override.remove?.includes(variable.name)
        );
      }

      if (override.add) {
        collection.variables.push(...(override.add as FigmaVariable[]));
      }

      if (override.valueChanges) {
        for (const variable of collection.variables) {
          const update = override.valueChanges[variable.name];
          if (!update) continue;
          variable.valuesByMode = { ...(variable.valuesByMode || {}), ...update };
          const resolved = variable.resolvedValuesByMode || {};
          for (const [modeId, value] of Object.entries(update)) {
            resolved[modeId] = { resolvedValue: value, alias: null };
          }
          variable.resolvedValuesByMode = resolved;
        }
      }

      if (override.modeMismatch) {
        for (const variable of collection.variables) {
          const update = override.modeMismatch[variable.name];
          if (!update) continue;
          variable.valuesByMode = update;
          const resolved: Record<string, { resolvedValue: unknown; alias: null }> = {};
          for (const [modeId, value] of Object.entries(update)) {
            resolved[modeId] = { resolvedValue: value, alias: null };
          }
          variable.resolvedValuesByMode = resolved;
        }
      }
    }
  } catch {
    // drift overlay is optional
  }

  return collections;
}

function normalizedDocumentToCollections(document: NormalizedTokenDocument): FigmaVariableCollection[] {
  const typeByGroup: Record<TokenGroup, string> = {
    color: "COLOR",
    spacing: "FLOAT",
    typography: "STRING",
    radius: "FLOAT",
    shadow: "STRING"
  };

  return (Object.entries(document.tokens || {}) as Array<
    [TokenGroup, NormalizedTokenDocument["tokens"][TokenGroup]]
  >).map(([group, tokens]) => ({
    id: `fixture:${group}`,
    name: group[0].toUpperCase() + group.slice(1),
    modes: { value: "Value" },
    variables: Object.values(tokens || {}).map((token) => {
      const value = token.value as TokenValue;
      return {
        id: token.figmaVariableId || `fixture:${token.name}`,
        name: token.name.replace(`${group}.`, "").replace(/\./g, "/"),
        description: token.description,
        type: token.type || typeByGroup[group],
        valuesByMode: { value },
        resolvedValuesByMode: { value: { resolvedValue: value, alias: token.aliasOf || null } }
      };
    })
  }));
}

export async function fetchFigmaVariables(): Promise<FigmaVariablesResponse> {
  const env = loadEnvConfig();
  const bridge = await loadBridgeCollections();

  const useLiveVariablesApi =
    process.env.FIGMA_USE_LIVE_VARIABLES_API === "1" ||
    process.env.FIGMA_USE_LIVE_VARIABLES_API === "true";

  const figmaAccessToken = env.figmaAccessToken;
  const figmaFileKey = env.figmaFileKey;
  const canUseFigmaApi = Boolean(env.figmaLive && figmaAccessToken && figmaFileKey);

  // Default: Figma Bridge export at fixtures/figma/bridge-collections.json (no file_variables:read on PAT).
  // Opt in to REST: FIGMA_USE_LIVE_VARIABLES_API=1 plus PAT with file_variables:read.
  if (useLiveVariablesApi) {
    if (!canUseFigmaApi) {
      const figmaMissing = env.missing.filter((m) => m.startsWith("FIGMA"));
      throw new Error(
        `FIGMA_USE_LIVE_VARIABLES_API is set but Figma API credentials are incomplete. Missing: ${
          figmaMissing.length ? figmaMissing.join(", ") : "FIGMA_ACCESS_TOKEN / FIGMA_FILE_KEY"
        }`
      );
    }
  } else {
    if (bridge) {
      return {
        figmaSourceFile: ALLOWED_FIGMA_SOURCE_FILE,
        collections: bridge
      };
    }
    throw new Error(
      "Figma variables: add fixtures/figma/bridge-collections.json (export from your Figma Bridge plugin) and deploy, or set FIGMA_USE_LIVE_VARIABLES_API=1 with a PAT that has file_variables:read."
    );
  }

  const url = `https://api.figma.com/v1/files/${figmaFileKey}/variables/local?refresh=${Date.now()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "X-Figma-Token": figmaAccessToken as string,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache"
    }
  });
  if (!response.ok) {
    const body = await response.text();
    const needsVariableScope =
      response.status === 403 && body.includes("file_variables:read");
    if (needsVariableScope) {
      throw new Error(
        "Figma token can open the file, but cannot read variables. Create/update FIGMA_ACCESS_TOKEN with the file_variables:read scope, then update the Vercel env var."
      );
    }
    throw new Error(`Figma API error ${response.status}: ${body}`);
  }
  const data = (await response.json()) as {
    meta?: {
      variableCollections?: Record<string, FigmaVariableCollection>;
      variables?: Record<string, FigmaVariable>;
    };
  };

  const collectionsMap = data.meta?.variableCollections || {};
  const variablesMap = data.meta?.variables || {};

  const collections: FigmaVariableCollection[] = Object.values(collectionsMap).map((collection) => {
    const modes = Array.isArray(collection.modes)
      ? Object.fromEntries(
          collection.modes.map((mode: { modeId: string; name: string }) => [mode.modeId, mode.name])
        )
      : collection.modes || {};
    const variables = Object.values(variablesMap).filter((v: unknown) => {
      const candidate = v as FigmaVariable & { variableCollectionId?: string };
      return candidate.variableCollectionId === collection.id;
    });
    return {
      id: collection.id,
      name: collection.name,
      modes,
      variables: variables.map((variable) => ({
        ...(variable as FigmaVariable & { resolvedType?: string }),
        type:
          (variable as FigmaVariable & { resolvedType?: string }).type ||
          (variable as FigmaVariable & { resolvedType?: string }).resolvedType ||
          "STRING"
      }))
    };
  });

  return {
    figmaSourceFile: ALLOWED_FIGMA_SOURCE_FILE,
    collections
  };
}
