import { compareAndReport } from "../src/sync/index.js";

await compareAndReport(
  "tokens/source/tokens.json",
  "fixtures/figma/variables-export.json",
  "reports/token-drift-report.md",
  "reports/pr-summary-example.md"
);

console.log("PR summary created at reports/pr-summary-example.md");
