# Developer Guide

## Pipeline Overview

- `src/app` - Angular v21 + PrimeNG frontend
- `server` - Node/Express API for Figma, GitHub, token comparison, and PR creation
- `src/shared` - shared TypeScript contracts for API payloads
- `src/normalize` - converts raw variable collections into canonical token JSON
- `src/compare` - computes drift between source tokens and Figma export
- `src/reports` - creates markdown drift report and PR summary
- `src/sync` - orchestrates loading, writing, and report generation

## Local App Development

Run both the API and frontend:

`npm run dev`

Run pieces independently:

- `npm run dev:api` - Express API at `http://localhost:4000`
- `npm run dev:web` - Angular app at `http://localhost:4200`

The Angular dev server proxies `/api/*` calls to the Node API using `proxy.conf.json`.

## Token Generation

Run:

`npm run normalize:tokens`

This reads the three provided source files and writes:

- `tokens/source/tokens.json`

## Drift Reporting

Run:

`npm run report:tokens`

Outputs:

- `reports/token-drift-report.md`
- `reports/pr-summary-example.md`

## Breaking Check (CI Gate)

Run:

`npm run check:tokens`

The command exits with code `1` when any breaking drift is detected.

## Script Details

- `scripts/normalize-tokens.js`: source merge + normalization
- `scripts/create-figma-fixture.js`: creates fixture with controlled drift scenarios
- `scripts/report-tokens.js`: compares source and fixture, writes reports
- `scripts/check-tokens.js`: same comparison, fails on breaking drift
- `scripts/create-token-pr-summary.js`: convenience script for PR summary regeneration
