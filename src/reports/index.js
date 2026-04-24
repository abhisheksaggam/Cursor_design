function bulletList(items) {
  if (!items.length) return "- None";
  return items.map((item) => `- ${item}`).join("\n");
}

function formatJson(value) {
  return `\`${JSON.stringify(value)}\``;
}

function riskLevel(result) {
  if (result.summary.breaking) return "High";
  if (result.summary.extraInFigma > 0) return "Medium";
  return "Low";
}

export function buildDriftReport(result) {
  return `# Token Drift Report

## Overview
- Missing in Figma: ${result.summary.missingInFigma}
- Extra in Figma: ${result.summary.extraInFigma}
- Value changes: ${result.summary.valueChanges}
- Mode mismatches: ${result.summary.modeMismatches}
- Rename candidates: ${result.summary.renamedCandidates}
- Breaking: ${result.summary.breaking ? "Yes" : "No"}

## Missing In Figma
${bulletList(result.missingInFigma)}

## Extra In Figma
${bulletList(result.extraInFigma)}

## Value Changes
${result.valueChanges.length ? result.valueChanges.map((change) => `- ${change.token}: source=${formatJson(change.sourceValue)} figma=${formatJson(change.figmaValue)}`).join("\n") : "- None"}

## Mode Mismatches
${result.modeMismatches.length ? result.modeMismatches.map((change) => `- ${change.token}: sourceModes=${formatJson(change.sourceModes)} figmaModes=${formatJson(change.figmaModes)}`).join("\n") : "- None"}

## Rename Candidates
${result.renamedCandidates.length ? result.renamedCandidates.map((rename) => `- ${rename.sourceToken} -> ${rename.figmaToken}`).join("\n") : "- None"}
`;
}

export function buildPrSummary(result) {
  return `# PR Summary: Design Token Drift

## Simple explanation (for designers)
This PR checks whether Figma variables still match the shared token system in GitHub. It highlights missing, renamed, or changed tokens so design and engineering stay aligned before release.

## Technical explanation (for developers)
GitHub is treated as source of truth (tokens/source/tokens.json). The drift checker compares a Figma export fixture against normalized token keys and values, then flags breaking mismatches (missing tokens, value changes, mode mismatches, and likely renames).

## Token diff table
| Drift Type | Count | Breaking |
| --- | ---: | :---: |
| Missing in Figma | ${result.summary.missingInFigma} | Yes |
| Extra in Figma | ${result.summary.extraInFigma} | No |
| Value changes | ${result.summary.valueChanges} | Yes |
| Mode mismatches | ${result.summary.modeMismatches} | Yes |
| Rename candidates | ${result.summary.renamedCandidates} | Yes |

## Risk level
**${riskLevel(result)}**

## Approval checklist
- [ ] Designer confirms intended token changes
- [ ] Design system owner validates naming consistency
- [ ] Engineer confirms no unintended visual regressions
- [ ] Breaking drift resolved or explicitly approved
- [ ] Updated fixture/export attached for traceability
`;
}
