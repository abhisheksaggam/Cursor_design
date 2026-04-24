# Designer Guide

## What this system does

This workflow checks whether the variables in Figma still match the shared token system used in code.

## Why it matters

- Prevents accidental visual drift between design and shipped UI
- Makes token changes reviewable before release
- Gives a shared language for design + engineering approvals

## How to use it

1. Update tokens in Figma.
2. Export variables and replace `fixtures/figma/variables-export.json` (or your real export file in CI).
3. Run `npm run report:tokens`.
4. Review:
   - `reports/token-drift-report.md`
   - `reports/pr-summary-example.md`

## What to look for in reports

- **Missing token**: token exists in code source but not in Figma export
- **Extra token**: token exists in Figma but not in code source
- **Value change**: same token name, different value
- **Mode mismatch**: responsive token values differ by mode
- **Rename candidate**: same value appears under a different name

## Approval expectation

If the report shows breaking drift, review with engineering and the design-system owner before merging.
