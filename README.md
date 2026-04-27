# Design Token Consistency System

A design-token consistency workflow plus a small web app where designers can
trigger checks between **Figma Variables** and **GitHub design tokens**, and
repo owners can review and open PRs with proposed updates.

- GitHub is the **source of truth**.
- Figma is treated as an **external proposal**.
- Figma changes never overwrite GitHub without human approval.

## What is inside

- `src/app/` - Next.js App Router UI and API routes
- `src/components/` - UI components (diff preview, branch selector, approval panel, etc.)
- `src/lib/figma/` - Figma variables fetch + normalization
- `src/lib/github/` - GitHub tokens fetch, branches, PR creation
- `src/lib/tokens/` - compare, classify, generate preview
- `src/normalize/`, `src/compare/`, `src/reports/`, `src/sync/` - CLI token pipeline (pre-existing)
- `tokens/input/*.json` - original exports (only allowed Figma source file)
- `tokens/source/tokens.json` - normalized canonical token set
- `fixtures/figma/*.json` - demo-mode fixtures (drift-seeded)
- `reports/*.md` - drift + PR-summary markdown outputs

## Figma Access Rule

- Only this Figma file is allowed as an upstream source:
  - `https://www.figma.com/design/zFN780oP27DS6zOAhdRSU7/Cursor?node-id=1-777&t=JDkt7LLCh9P0uIBS-1`
- Enforcement:
  - Normalization throws if `FIGMA_SOURCE_FILE_URL` is anything else.
  - API routes assert the same policy on every request.
  - CI `check:tokens` fails if source/fixture point to a different URL.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `FIGMA_ACCESS_TOKEN` | Personal access token for Figma Variables API (enterprise). |
| `FIGMA_FILE_KEY` | Figma file key for variables fetch. |
| `GITHUB_TOKEN` | GitHub token with `contents:write` and `pull-requests:write`. |
| `GITHUB_OWNER` | Target repo owner/org. |
| `GITHUB_REPO` | Target repo name. |
| `GITHUB_TOKEN_FILE_PATH` | Path to canonical token JSON in the repo (defaults to `tokens/source/tokens.json`). |

If any are missing, the app boots in **Demo mode**:
- Figma data is loaded from `tokens/input/*.json` + `fixtures/figma/demo-drift.json`.
- GitHub tokens load from `tokens/source/tokens.json`.
- Branches load from a fixture list.
- PR creation is disabled and returns a demo response.

## Commands

- `npm run normalize:tokens` - merge/normalize the three input exports.
- `npm run report:tokens` - generate drift and PR summary markdown reports.
- `npm run check:tokens` - fail if breaking drift is detected (CI gate).
- `npm run create:token-pr-summary` - regenerate PR summary output.
- `npm run dev` - start web app (Next.js). May need `ulimit -n 8192` on macOS.
- `npm run build && npm run start` - production build + server.

## Web app usage

### As a designer
1. Open the dashboard (`/`).
2. Click **Check updates**.
3. Review the **Change preview** table:
   - filter by `All`, `Safe`, `Review`, or `Breaking`
   - click a row to see the designer + developer explanation
4. Flag intent concerns back to the repo owner if anything looks off.

### As a repo owner
1. After a check run, review the preview and totals.
2. In **Approve and push**:
   - pick a target branch from the branch selector
   - a new `token-sync/...` branch will be created from it
3. Click **Create PR**.
4. Open the returned PR URL to review title, summary, diff table, risk level,
   and checklist before merging.

### Branch selection
- Branches come from `/api/github/branches` (live GitHub or fixture list).
- PR is never pushed to the selected branch directly - a new branch is created
  from it and the PR targets the selected branch as base.

## What is real vs stubbed

- Real:
  - Normalization logic (shared with the CLI token pipeline)
  - Drift comparison + classification + risk
  - Preview UI and filters
  - API contract for all five routes
  - PR body generation (title, summary, diff, risk, checklist)
- Stubbed (when env vars are missing):
  - Figma Variables API call (falls back to fixture collections + drift overlay)
  - GitHub tokens file fetch (falls back to local `tokens/source/tokens.json`)
  - Branch listing (fixture list)
  - PR creation (returns demo response)

## Security

- Figma and GitHub tokens are only read server-side in API routes.
- Frontend never sees credentials.
- Missing env vars surface a clear demo banner and disable PR creation.
