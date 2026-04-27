import type { FigmaVariableCollection } from "./fetchFigmaVariables";
import type {
  NormalizedToken,
  NormalizedTokenDocument,
  TokenGroup,
  TokenValue
} from "../../shared/types";
import { ALLOWED_FIGMA_SOURCE_FILE } from "../config";

const TYPE_TO_GROUP: Record<string, TokenGroup> = {
  COLOR: "color",
  FLOAT: "spacing",
  STRING: "typography"
};

function toKebab(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\/+/g, ".")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/(^[.-]+|[.-]+$)/g, "");
}

function normalizeColorName(name: string): string {
  const cleaned = name
    .replace(/wihte/gi, "white")
    .replace(/\s+-\s+/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
  const parts = cleaned.split("/").map((part) => part.trim());
  const normalized = parts.map((part) => toKebab(part)).filter(Boolean);
  return `color.${normalized.join(".")}`;
}

function normalizeSpacingName(name: string): string {
  return `spacing.${toKebab(name)}`;
}

function normalizeTypographyName(name: string): string {
  const cleaned = name.replace(/line heights/gi, "line-height");
  return `typography.${toKebab(cleaned)}`;
}

function normalizeRadiusName(name: string): string {
  return `radius.${toKebab(name)}`;
}

function normalizeShadowName(name: string): string {
  return `shadow.${toKebab(name)}`;
}

function deriveGroup(collectionName: string, type: string): TokenGroup | null {
  const name = (collectionName || "").toLowerCase();
  if (name.includes("shadow") || name.includes("elevation")) return "shadow";
  if (name.includes("radius") || name.includes("radii") || name.includes("corner")) {
    return "radius";
  }
  if (name.includes("typography")) return "typography";
  if (name.includes("spacing")) return "spacing";
  if (name.includes("colour") || name.includes("color")) return "color";
  return TYPE_TO_GROUP[type] || null;
}

function canonicalName(name: string, group: TokenGroup): string {
  if (group === "color") return normalizeColorName(name);
  if (group === "spacing") return normalizeSpacingName(name);
  if (group === "typography") return normalizeTypographyName(name);
  if (group === "radius") return normalizeRadiusName(name);
  return normalizeShadowName(name);
}

function canonicalValue(variable: {
  valuesByMode?: Record<string, unknown>;
  resolvedValuesByMode?: Record<string, { resolvedValue: unknown }>;
}): TokenValue {
  const values = variable.resolvedValuesByMode || variable.valuesByMode || {};
  const first = Object.values(values)[0] as
    | { resolvedValue?: TokenValue }
    | TokenValue
    | undefined;
  if (first && typeof first === "object" && "resolvedValue" in first) {
    return (first as { resolvedValue: TokenValue }).resolvedValue ?? null;
  }
  return (first as TokenValue) ?? null;
}

function buildModes(
  variable: {
    valuesByMode?: Record<string, unknown>;
    resolvedValuesByMode?: Record<string, { resolvedValue: unknown }>;
  },
  collection: FigmaVariableCollection
): Record<string, TokenValue> | undefined {
  const values = variable.resolvedValuesByMode || variable.valuesByMode || {};
  const entries = Object.entries(values);
  if (entries.length <= 1) return undefined;
  const result: Record<string, TokenValue> = {};
  for (const [modeId, modeValue] of entries) {
    const modeName = (collection.modes[modeId] || modeId).toLowerCase().replace(/\s+/g, "-");
    const resolved =
      modeValue && typeof modeValue === "object" && "resolvedValue" in (modeValue as object)
        ? (modeValue as { resolvedValue: TokenValue }).resolvedValue
        : (modeValue as TokenValue);
    result[modeName] = resolved ?? null;
  }
  return result;
}

function conflictPriority(description: string): number {
  if (description.includes("text-styles")) return 3;
  if (description.includes("heading")) return 2;
  return 1;
}

export function normalizeFigmaVariables(collections: FigmaVariableCollection[]): NormalizedTokenDocument {
  const tokens: NormalizedTokenDocument["tokens"] = {
    color: {},
    spacing: {},
    typography: {},
    radius: {},
    shadow: {}
  };
  const conflicts: NonNullable<NormalizedTokenDocument["conflicts"]> = [];

  for (const collection of collections) {
    for (const variable of collection.variables || []) {
      const group = deriveGroup(collection.name, variable.type);
      if (!group) continue;
      const name = canonicalName(variable.name, group);
      const value = canonicalValue(variable);
      const description = variable.description?.trim() || defaultDescription(group);
      const modes = buildModes(variable, collection);

      const token: NormalizedToken = {
        group,
        name,
        value,
        description,
        owner: "design-system",
        deprecated: false,
        replacement: null,
        figmaVariableId: variable.id,
        modes,
        type: variable.type
      };

      const existing = tokens[group][name];
      if (!existing) {
        tokens[group][name] = token;
        continue;
      }

      const existingPriority = conflictPriority((existing.description || "").toLowerCase());
      const nextPriority = conflictPriority((description || "").toLowerCase());
      if (nextPriority >= existingPriority) {
        conflicts.push({
          token: name,
          kept: variable.id,
          replaced: existing.figmaVariableId || null
        });
        tokens[group][name] = token;
      } else {
        conflicts.push({
          token: name,
          kept: existing.figmaVariableId || null,
          replaced: variable.id
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: "github",
    externalInput: "figma-variables-api",
    figmaSourceFile: ALLOWED_FIGMA_SOURCE_FILE,
    tokens,
    conflicts
  };
}

function defaultDescription(group: TokenGroup): string {
  if (group === "spacing") return "Layout spacing token.";
  if (group === "typography") return "Typography scale token.";
  if (group === "radius") return "Corner radius token.";
  if (group === "shadow") return "Elevation shadow token.";
  return "Color token.";
}
