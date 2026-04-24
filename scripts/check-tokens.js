import { compareAndReport } from "../src/sync/index.js";
import {
  ALLOWED_FIGMA_SOURCE_FILE,
  assertAllowedFigmaSourceFile
} from "../src/sync/figma-policy.js";
import { readFile } from "node:fs/promises";

const sourceDoc = JSON.parse(await readFile("tokens/source/tokens.json", "utf8"));
const figmaDoc = JSON.parse(await readFile("fixtures/figma/variables-export.json", "utf8"));

assertAllowedFigmaSourceFile(sourceDoc.figmaSourceFile);
assertAllowedFigmaSourceFile(figmaDoc.figmaSourceFile);

const comparison = await compareAndReport(
  "tokens/source/tokens.json",
  "fixtures/figma/variables-export.json",
  "reports/token-drift-report.md",
  "reports/pr-summary-example.md"
);

if (comparison.summary.breaking) {
  console.error("Breaking token drift detected. See reports/token-drift-report.md");
  process.exit(1);
}

console.log("No breaking token drift.");
