const TYPE_TO_GROUP = {
  COLOR: "color",
  FLOAT: "spacing",
  STRING: "typography"
};

function toKebab(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\/+/g, ".")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/(^[.-]+|[.-]+$)/g, "");
}

function normalizeColorName(name) {
  const cleaned = name
    .replace(/wihte/gi, "white")
    .replace(/\s+-\s+/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
  const parts = cleaned.split("/").map((part) => part.trim());
  const normalized = parts.map((part) => toKebab(part)).filter(Boolean);
  return `color.${normalized.join(".")}`;
}

function normalizeSpacingName(name) {
  return `spacing.${toKebab(name)}`;
}

function normalizeTypographyName(name) {
  const cleaned = name.replace(/line heights/gi, "line-height");
  return `typography.${toKebab(cleaned)}`;
}

function inferDescription(variable, group) {
  if (variable.description && variable.description.trim()) {
    return variable.description.trim();
  }
  if (group === "spacing") return "Layout spacing token.";
  if (group === "typography") return "Typography scale token.";
  return "Color token.";
}

function buildModes(variable, collection) {
  const modeMap = collection.modes || {};
  const values = variable.resolvedValuesByMode || variable.valuesByMode || {};
  const entries = Object.entries(values);
  if (entries.length <= 1) return null;
  const result = {};
  for (const [modeId, modeValue] of entries) {
    const modeName = (modeMap[modeId] || modeId).toLowerCase().replace(/\s+/g, "-");
    const resolved = modeValue?.resolvedValue ?? modeValue;
    result[modeName] = resolved;
  }
  return result;
}

function canonicalName(variable, group) {
  if (group === "color") return normalizeColorName(variable.name);
  if (group === "spacing") return normalizeSpacingName(variable.name);
  return normalizeTypographyName(variable.name);
}

function deriveGroup(variable, collection) {
  const collectionName = (collection.name || "").toLowerCase();
  if (collectionName.includes("typography")) return "typography";
  if (collectionName.includes("spacing")) return "spacing";
  if (collectionName.includes("colour") || collectionName.includes("color")) return "color";
  return TYPE_TO_GROUP[variable.type];
}

function canonicalValue(variable) {
  const values = variable.resolvedValuesByMode || variable.valuesByMode || {};
  const first = Object.values(values)[0];
  return first?.resolvedValue ?? first ?? null;
}

function tokenMeta(variable, description) {
  return {
    description,
    owner: "design-system",
    deprecated: false,
    replacement: null,
    figmaVariableId: null
  };
}

function conflictPriority(name) {
  if (name.includes("text-styles")) return 3;
  if (name.includes("heading")) return 2;
  return 1;
}

export function normalizeCollections(collections, options = {}) {
  const tokens = {
    color: {},
    spacing: {},
    typography: {},
    radius: {},
    shadow: {}
  };
  const conflicts = [];

  for (const collection of collections) {
    for (const variable of collection.variables || []) {
      const group = deriveGroup(variable, collection);
      if (!group) continue;
      const name = canonicalName(variable, group);
      const value = canonicalValue(variable);
      const description = inferDescription(variable, group);
      const modes = buildModes(variable, collection);
      const entry = { value, ...tokenMeta(variable, description) };
      if (modes) entry.modes = modes;

      const existing = tokens[group][name];
      if (!existing) {
        tokens[group][name] = entry;
        continue;
      }

      const existingPriority = conflictPriority(existing.description.toLowerCase());
      const nextPriority = conflictPriority(description.toLowerCase());
      if (nextPriority >= existingPriority) {
        conflicts.push({
          token: name,
          kept: variable.id,
          replaced: existing.figmaVariableId
        });
        tokens[group][name] = entry;
      } else {
        conflicts.push({
          token: name,
          kept: existing.figmaVariableId,
          replaced: variable.id
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: "github",
    externalInput: "figma-variables-export",
    figmaSourceFile: options.figmaSourceFile || null,
    tokens,
    conflicts
  };
}
