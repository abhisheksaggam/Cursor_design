import { mkdir } from "node:fs/promises";
import { normalizeFromInputs } from "../src/sync/index.js";
import {
  ALLOWED_FIGMA_SOURCE_FILE,
  assertAllowedFigmaSourceFile
} from "../src/sync/figma-policy.js";

const inputPaths = [
  "tokens/input/Colours.json",
  "tokens/input/Spacing.json",
  "tokens/input/Typography.json"
];

const figmaSourceFile = process.env.FIGMA_SOURCE_FILE_URL || ALLOWED_FIGMA_SOURCE_FILE;
assertAllowedFigmaSourceFile(figmaSourceFile);

await mkdir("tokens/source", { recursive: true });
const normalized = await normalizeFromInputs(inputPaths, "tokens/source/tokens.json", {
  figmaSourceFile
});
console.log(`Normalized tokens generated: ${Object.keys(normalized.tokens.color).length} colors, ${Object.keys(normalized.tokens.spacing).length} spacing, ${Object.keys(normalized.tokens.typography).length} typography.`);
