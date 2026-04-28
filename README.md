# Cursor_design — Design system workspace

This repository hosts **two parallel tracks** on separate Git branches: a production-minded **design-token governance app** on `main`, and a **United Utilities vehicle-finance dashboard prototype** on `United-Utilities`. Both deploy to **Vercel** under different projects so you can preview each line of work without branch checkout.

---

## Intent (why this exists)

| Audience | Purpose |
| --- | --- |
| **Design & eng** | Keep **GitHub** as the **source of truth** for design tokens while **Figma** supplies **proposals**. Nothing in Figma should overwrite GitHub without human review and an explicit PR. |
| **Product** | On `main`: a **dashboard** to compare Figma variables with repo tokens, classify risk (safe / review / breaking), and **open PRs** with structured summaries. |
| **Stakeholder demo** | On `United-Utilities`: a **static, front-end-only** operations-style **dashboard** (vehicle finance KPIs, status mix, monthly trends) styled with the same token vocabulary, for visual alignment and narrative—**not** the full token-sync workflow. |

---

## Deployments (live)

| Branch | Vercel project (name) | Production URL |
| --- | --- | --- |
| `main` | `cursor-design-live` | https://cursor-design-live.vercel.app |
| `United-Utilities` | `united-utilities-dashboard` | https://united-utilities-dashboard.vercel.app |

**How deploys map to branches**

- **`main` → `cursor-design-live`**  
  Standard Vercel Git integration: pushes to `main` build and deploy this app.

- **`United-Utilities` → `united-utilities-dashboard`**  
  This project’s `vercel.json` includes an **`ignoreCommand`** so a build runs **only** when `VERCEL_GIT_COMMIT_REF` is `United-Utilities`. Pushes to `main` **do not** update this preview. If the live site ever looks stale, confirm the latest commit on `United-Utilities` completed a Vercel build.

Both projects use the same layout: **static Angular** (`npm run build:web`) plus **serverless API** at `api/index.ts` (see `vercel.json` routes: `/api/*` → Node function, SPA fallback → `index.html`).

---

## Product state (where things stand)

### `main` — Design Token Consistency System (primary product)

**Stage:** **Feature-complete for the core loop** — compare → preview → branch select → PR — with demo fallbacks when secrets are missing.

**What is implemented:**

- **Angular 21 + PrimeNG** UI: health (Figma/GitHub live vs fallback), risk summary, filtered change preview, branch picker, PR creation with commit message.
- **Node/Express API** (`server/`, mirrored for Vercel in `api/index.ts`): health, Figma variables, GitHub tokens & branches, token compare + preview, create PR.
- **Figma ingestion** (`src/lib/figma/`): default path uses **Bridge export** `fixtures/figma/bridge-collections.json` when present; optional **live** Figma Variables API when `FIGMA_ACCESS_TOKEN` + file key exist and **`FIGMA_USE_LIVE_VARIABLES_API=1`** (PAT needs `file_variables:read`).
- **GitHub** (`src/lib/github/`): fetch canonical token JSON from repo, list branches, create PR with generated body.
- **Token engine** (`src/lib/tokens/`): normalize, compare, classify risk, generate preview copy.
- **CLI / policy** (`scripts/`, `src/normalize/`, `src/compare/`, `reports/`): normalize inputs, reports, **`check:tokens`** gate.
- **CI** (`.github/workflows/token-drift.yml` on `main`): `normalize:tokens` → `report:tokens` → `check:tokens` on push/PR.

**Still implicit / next steps for contributors:**

- Expand automated tests beyond CLI/token gates if you need regression coverage on UI/API.
- Confirm production env vars on `cursor-design-live` match `.env.example` for full live mode (see below).

---

### `United-Utilities` — Finance dashboard prototype

**Stage:** **UI prototype** — demonstrates layout, hierarchy, and **token-driven styling** for a vehicle-finance narrative using **hard-coded demo data**.

**What differs from `main`:**

- Single **dashboard surface**: KPI cards, application status breakdown, monthly metrics, finance table, product ranks (`src/app/app.component.*` simplified; no PrimeNG token workflow screens).
- **Styling** refactored (`src/styles.css`, component CSS) to align with **canonical Figma token keys** used as CSS variables (e.g. chart/status colors).
- **Tooling**: `.editorconfig`, `.prettierrc`, `tsconfig.spec.json`; `vercel.json` **`ignoreCommand`** so only this branch builds the `united-utilities-dashboard` project.

**Not the focus of this branch:** wiring live Figma/GitHub compare flows into the finance UI—that remains on `main`.

---

## Repository map (quick orientation)

| Path | Role |
| --- | --- |
| `src/app/` | Angular app shell (workflow UI on `main`, dashboard-only on `United-Utilities`). |
| `api/index.ts` | Vercel serverless entry; keep in sync with `server/app.ts` behavior for `/api/*`. |
| `server/` | Local Express API (`npm run dev:api`, port **4000**). |
| `src/lib/` | Shared config, Figma, GitHub, token logic (both branches share much of this). |
| `src/shared/types.ts` | API/contracts shared by frontend and backend. |
| `fixtures/figma/` | Bridge snapshot + drift demos for offline/demo mode. |
| `tokens/` | Inputs + canonical `tokens/source/tokens.json`; CLI consumes these. |
| `vercel.json` | Build output `dist/web/browser`, `/api` rewrite, **`ignoreCommand` only on `United-Utilities`**. |

---

## Environment variables

Copy `.env.example` to `.env.local` (git-ignored). Summary:

| Variable | Role |
| --- | --- |
| `FIGMA_ACCESS_TOKEN` | Figma PAT when using live APIs. |
| `FIGMA_FILE_KEY` / `FIGMA_FILE_URL` | File scope; key can be derived from URL. |
| `FIGMA_USE_LIVE_VARIABLES_API` | Set to `1` to use REST variables API instead of default bridge fixture path. |
| `GITHUB_*` | Repo + token + path to canonical token JSON in repo. |

**Policy:** Only one Figma **source file** URL is allowed in code (`ALLOWED_FIGMA_SOURCE_FILE` in `src/lib/config.ts`); mismatches throw. If Figma/GitHub env is incomplete, the app runs in **demo/fixture mode** with a visible health state and PR creation disabled or stubbed.

---

## Commands

| Command | Meaning |
| --- | --- |
| `npm run dev` | API (4000) + Angular (4200) with `proxy.conf.json` → `/api` to local server. |
| `npm run dev:api` / `npm run dev:web` | Run one half only. |
| `npm run build` | `ng build` + `tsc` for server. |
| `npm run build:web` | Front-end only (what Vercel build uses). |
| `npm run start` | Run compiled server (`tsx server/index.ts`). |
| `npm run normalize:tokens` / `report:tokens` / `check:tokens` | CLI token pipeline + CI gate. |

---

## Web app flows (`main`)

1. Open `/`, run **Check updates**, read **Live sync health**.
2. Review **Change preview** with filters (All / Safe / Review / Breaking).
3. Repo owner: pick base branch → **Create PR** (new `token-sync/...` branch; does not push directly to base).

---

## Security notes

- Tokens live **only** on the server; the browser never receives Figma/GitHub secrets.
- Demo mode is obvious from health tags; live PR creation requires full GitHub scope as documented in `.env.example`.

---

## For AI agents — resume context (machine-oriented)

Use this block to bootstrap work without re-deriving repo facts.

```yaml
repo: Cursor_design
package_name: design-token-consistency-system
stack: Angular 21, PrimeNG, Express 5, TypeScript, Vercel Node serverless api
primary_branch: main
secondary_branch: United-Utilities
vercel:
  main_url: https://cursor-design-live.vercel.app
  main_project: cursor-design-live
  united_utilities_url: https://united-utilities-dashboard.vercel.app
  united_utilities_project: united-utilities-dashboard
  united_utilities_ignore_command: builds only when VERCEL_GIT_COMMIT_REF == United-Utilities
intent_main: Figma proposals vs GitHub tokens; PR workflow; GitHub source of truth
intent_united_utilities: Static finance dashboard UI; token-aligned CSS; demo data
figma_defaults: bridge-collections.json; live API optional with FIGMA_USE_LIVE_VARIABLES_API=1
policy: single allowed Figma file URL in src/lib/config.ts ALLOWED_FIGMA_SOURCE_FILE
api_paths: GET /api/health,/api/figma/variables,/api/github/tokens,/api/github/branches; POST /api/tokens/compare,/api/github/create-pr
local_api_port: 4000
angular_dev_port: 4200
ci_main: .github/workflows/token-drift.yml runs normalize, report, check:tokens
```

When changing API behavior, update **`server/app.ts`** and **`api/index.ts`** together. When changing env contract, update **`.env.example`** and this README if the workflow shifts.

---

## License / visibility

Private project (`package.json`: `"private": true`). `.vercel/` link metadata may exist locally under ignored checkouts; **do not commit** `.vercel/` to the repo (see Vercel README in those folders).
