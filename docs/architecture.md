# Architecture

## Input Interpretation

The system ingests exactly three Figma variable exports:

- `Colours.json` - color primitives and semantic text/icon colors
- `Spacing.json` - spacing scale values (`space-*`)
- `Typography.json` - font family, weights, size, line-height, and responsive text-style scales

Exports were taken from this Figma file:
- `https://www.figma.com/design/zFN780oP27DS6zOAhdRSU7/Cursor?node-id=1-777&t=JDkt7LLCh9P0uIBS-1`

Each file is a variable collection with:

- collection metadata (`name`, `modes`)
- variables list (`type`, `name`, `description`, `valuesByMode`, `resolvedValuesByMode`)

## Merge and Normalization Rules

Normalization output is written to `tokens/source/tokens.json`.

Rules:

1. **Grouping by token type**
   - `color`, `spacing`, `typography`, with `radius` and `shadow` reserved.
2. **Naming normalization**
   - Slash-separated names become dot notation.
   - Names are lowercased and converted to kebab segments.
   - Example: `Brand/Primary/Midnight Green/Midnight Green - 950` ->
     `color.brand.primary.midnight-green.midnight-green-950`
3. **Mode support**
   - Multi-mode variables keep a `modes` map (e.g., typography responsive scales).
4. **Metadata**
   - Every token receives:
     - `description`
     - `owner: "design-system"`
     - `deprecated: false`
     - `replacement: null`
     - `figmaVariableId: null`
5. **Duplicate/conflict handling**
   - If two normalized keys collide, a deterministic priority keeps the more specific text-style token.
   - Conflict decisions are recorded in `conflicts` in the normalized file.

## Conflicts and Inconsistencies Found

- Inconsistent naming/casing:
  - `Size/XL` vs `Size/xs`
  - `Semi Bold` vs `SemiBold`
  - typo: `Wihte - 50`
- Semantic overlap:
  - semantic text and icon colors alias brand colors in source
- Potential scale ambiguity:
  - typography has both primitive size tokens and text-style-specific sizes/line-heights

Resolution decisions:

- Kept both primitive and text-style tokens under `typography.*` namespaces to avoid destructive flattening.
- Preserved semantic color tokens even when values overlap brand primitives.
- Applied typo correction only in normalized key (`white`) while keeping source value unchanged.

## Source of Truth

- **GitHub**: canonical token state in `tokens/source/tokens.json`
- **Figma**: external input from variable exports
- Drift is computed as `source` vs `figma` and surfaced as markdown reports.

## Drift Detection

The comparator detects:

- missing tokens in Figma
- extra tokens in Figma
- value changes
- mode mismatches
- probable renames (same value, new key)

Breaking conditions:

- missing token
- value change
- mode mismatch
- rename candidate

CI fails on breaking drift via `npm run check:tokens`.
