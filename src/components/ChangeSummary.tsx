import type { ComparePreview, TokenChange, TokenGroup } from "@/lib/types";
import { groupLabel } from "@/lib/ui/tokenValue";

function countBy<T, K extends string | number | symbol>(items: T[], key: (t: T) => K): Record<K, number> {
  const result = {} as Record<K, number>;
  for (const item of items) {
    const k = key(item);
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

function narrativeForChange(change: TokenChange): string | null {
  const label = groupLabel(change.group).toLowerCase();
  switch (change.type) {
    case "added":
      return `1 new ${label} token proposed`;
    case "removed":
      return `1 ${label} token removed`;
    case "value-change":
      return `1 ${label} value updated`;
    case "rename-candidate":
      return `1 ${label} token renamed`;
    case "missing-mode":
      return `1 ${label} breakpoint missing`;
    case "mode-change":
      return `1 ${label} responsive set updated`;
    case "description-change":
      return `1 ${label} description updated`;
    case "alias-change":
      return `1 ${label} link changed`;
    case "type-change":
      return `1 ${label} type changed`;
    default:
      return null;
  }
}

function buildHeadline(preview: ComparePreview): string {
  const { breaking, reviewNeeded, safe, total } = preview.totals;
  if (total === 0) return "No token drift detected. Design and code are aligned.";
  if (breaking > 0)
    return `${breaking} breaking change${breaking === 1 ? "" : "s"} need owner approval before merge.`;
  if (reviewNeeded > 0)
    return `${reviewNeeded} change${reviewNeeded === 1 ? "" : "s"} should be reviewed before approval.`;
  return `${safe} safe update${safe === 1 ? "" : "s"} ready for a quick sanity check.`;
}

export function ChangeSummary({ preview }: { preview: ComparePreview }) {
  const { totals, changes } = preview;
  const headline = buildHeadline(preview);

  const byGroup = countBy<TokenChange, TokenGroup>(changes, (c) => c.group);
  const groupChips = Object.entries(byGroup) as Array<[TokenGroup, number]>;

  const narratives = changes.map(narrativeForChange).filter(Boolean) as string[];
  const narrativeCounts = countBy(narratives, (n) => n);
  const narrativeList = Object.entries(narrativeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <section className="bg-white border border-surface-muted rounded-2xl shadow-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.14em] text-ink-muted">Design system review</div>
          <h2 className="mt-1 text-xl font-semibold text-ink">{headline}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Figma variables were compared against the GitHub token source. No code changes have
            happened yet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RiskPill label="Breaking" count={totals.breaking} tone="danger" />
          <RiskPill label="Review" count={totals.reviewNeeded} tone="warning" />
          <RiskPill label="Safe" count={totals.safe} tone="success" />
        </div>
      </div>

      {totals.total > 0 && (
        <div className="mt-5 grid md:grid-cols-2 gap-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">By area</div>
            <div className="flex flex-wrap gap-2">
              {groupChips.map(([group, count]) => (
                <span
                  key={group}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-1 text-xs text-ink-soft"
                >
                  <span className="font-medium text-ink">{groupLabel(group)}</span>
                  <span className="text-ink-muted">{count}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted mb-2">What changed</div>
            <ul className="text-sm text-ink-soft space-y-1">
              {narrativeList.map(([text, count]) => (
                <li key={text}>
                  - {count > 1 ? text.replace(/^1 /, `${count} `) : text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function RiskPill({
  label,
  count,
  tone
}: {
  label: string;
  count: number;
  tone: "danger" | "warning" | "success";
}) {
  const toneBg =
    tone === "danger" ? "bg-danger-soft" : tone === "warning" ? "bg-warning-soft" : "bg-success-soft";
  const toneText =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-success";
  return (
    <div className={`rounded-xl px-4 py-3 min-w-[110px] ${toneBg}`}>
      <div className={`text-2xl font-semibold ${toneText}`}>{count}</div>
      <div className="text-xs text-ink-soft mt-0.5">{label}</div>
    </div>
  );
}
