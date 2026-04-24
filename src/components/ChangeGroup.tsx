import type { RiskLevel, TokenChange } from "@/lib/types";
import { ChangeCard } from "@/components/ChangeCard";

const HEADINGS: Record<RiskLevel, { title: string; copy: string }> = {
  breaking: {
    title: "Breaking changes",
    copy: "These break compatibility or require a coordinated deprecation. Design system owner approval required before merge."
  },
  "review-needed": {
    title: "Needs review",
    copy: "Intentional change checks. Verify visual impact matches design intent before approving."
  },
  safe: {
    title: "Safe updates",
    copy: "Additive or metadata-only. Can generally be merged after a quick sanity check."
  }
};

export function ChangeGroup({
  risk,
  changes
}: {
  risk: RiskLevel;
  changes: TokenChange[];
}) {
  if (changes.length === 0) return null;
  const heading = HEADINGS[risk];

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-ink">{heading.title}</h3>
          <p className="text-sm text-ink-soft max-w-2xl">{heading.copy}</p>
        </div>
        <span className="text-xs text-ink-muted uppercase tracking-wide">
          {changes.length} change{changes.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="rounded-xl border border-surface-muted bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead className="bg-surface-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-ink-muted font-medium">
                  Token
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-ink-muted font-medium">
                  Area
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-ink-muted font-medium">
                  Change
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-ink-muted font-medium">
                  Values
                </th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-ink-muted font-medium">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change) => (
                <ChangeCard
                  key={`${change.token}-${change.type}-${change.affectedMode || ""}`}
                  change={change}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
