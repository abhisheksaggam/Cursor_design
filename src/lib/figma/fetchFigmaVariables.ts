import { readFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_FIGMA_SOURCE_FILE, loadEnvConfig } from "@/lib/config";

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
  demoMode: boolean;
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

async function loadFixtureCollections(): Promise<FigmaVariableCollection[]> {
  const root = process.cwd();
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

export async function fetchFigmaVariables(): Promise<FigmaVariablesResponse> {
  const env = loadEnvConfig();
  if (env.demoMode || !env.figmaAccessToken || !env.figmaFileKey) {
    const collections = await loadFixtureCollections();
    return {
      demoMode: true,
      figmaSourceFile: ALLOWED_FIGMA_SOURCE_FILE,
      collections
    };
  }

  const url = `https://api.figma.com/v1/files/${env.figmaFileKey}/variables/local`;
  const response = await fetch(url, {
    headers: { "X-Figma-Token": env.figmaAccessToken }
  });
  if (!response.ok) {
    throw new Error(`Figma API error ${response.status}: ${await response.text()}`);
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
    demoMode: false,
    figmaSourceFile: ALLOWED_FIGMA_SOURCE_FILE,
    collections
  };
}
