# PR Summary: Design Token Drift

## Simple explanation (for designers)
This PR checks whether Figma variables still match the shared token system in GitHub. It highlights missing, renamed, or changed tokens so design and engineering stay aligned before release.

## Technical explanation (for developers)
GitHub is treated as source of truth (tokens/source/tokens.json). The drift checker compares a Figma export fixture against normalized token keys and values, then flags breaking mismatches (missing tokens, value changes, mode mismatches, and likely renames).

## Token diff table
| Drift Type | Count | Breaking |
| --- | ---: | :---: |
| Missing in Figma | 0 | Yes |
| Extra in Figma | 0 | No |
| Value changes | 0 | Yes |
| Mode mismatches | 0 | Yes |
| Rename candidates | 0 | Yes |

## Risk level
**Low**

## Approval checklist
- [ ] Designer confirms intended token changes
- [ ] Design system owner validates naming consistency
- [ ] Engineer confirms no unintended visual regressions
- [ ] Breaking drift resolved or explicitly approved
- [ ] Updated fixture/export attached for traceability
