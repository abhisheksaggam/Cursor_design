"use client";

import { useMemo, useState } from "react";
import type { ComparePreview, RiskLevel, TokenGroup } from "@/lib/types";
import { ChangeGroup } from "@/components/ChangeGroup";
import { groupLabel } from "@/lib/ui/tokenValue";

type FilterValue = "all" | RiskLevel;
type GroupFilter = "all" | TokenGroup;

const RISK_FILTERS: Array<{ id: FilterValue; label: string }> = [
  { id: "all", label: "All" },
  { id: "breaking", label: "Breaking" },
  { id: "review-needed", label: "Review" },
  { id: "safe", label: "Safe" }
];

export function TokenDiffPreview({ preview }: { preview: ComparePreview }) {
  const [riskFilter, setRiskFilter] = useState<FilterValue>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");

  const groupOptions = useMemo<GroupFilter[]>(() => {
    const set = new Set<TokenGroup>();
    preview.changes.forEach((c) => set.add(c.group));
    return ["all", ...Array.from(set)];
  }, [preview.changes]);

  const filtered = useMemo(() => {
    return preview.changes.filter((c) => {
      const riskOk = riskFilter === "all" || c.risk === riskFilter;
      const groupOk = groupFilter === "all" || c.group === groupFilter;
      return riskOk && groupOk;
    });
  }, [preview.changes, riskFilter, groupFilter]);

  const breaking = filtered.filter((c) => c.risk === "breaking");
  const review = filtered.filter((c) => c.risk === "review-needed");
  const safe = filtered.filter((c) => c.risk === "safe");

  if (preview.changes.length === 0) {
    return (
      <section className="bg-white border border-surface-muted rounded-2xl shadow-card px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-ink">Everything aligned</h2>
        <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto">
          Figma variables match the GitHub token source. No drift to review right now.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-surface-muted rounded-xl px-4 py-3">
        <div className="flex items-center gap-1 p-1 bg-surface-subtle rounded-full">
          {RISK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setRiskFilter(f.id)}
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                riskFilter === f.id ? "bg-white shadow-sm text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="text-xs uppercase tracking-wide text-ink-muted">Area</span>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as GroupFilter)}
            className="bg-white border border-surface-muted rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {group === "all" ? "All areas" : groupLabel(group)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ChangeGroup risk="breaking" changes={breaking} />
      <ChangeGroup risk="review-needed" changes={review} />
      <ChangeGroup risk="safe" changes={safe} />

      {filtered.length === 0 && (
        <div className="bg-white border border-surface-muted rounded-xl px-6 py-10 text-center text-ink-soft">
          No changes match the current filters.
        </div>
      )}
    </section>
  );
}
