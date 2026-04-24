import { mkdir } from "node:fs/promises";
import { compareAndReport } from "../src/sync/index.js";

await mkdir("reports", { recursive: true });
const comparison = await compareAndReport(
  "tokens/source/tokens.json",
  "fixtures/figma/variables-export.json",
  "reports/token-drift-report.md",
  "reports/pr-summary-example.md"
);

console.log("Drift report written.");
console.log(JSON.stringify(comparison.summary, null, 2));
