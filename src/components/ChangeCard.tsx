"use client";

import { useState } from "react";
import type { TokenChange } from "@/lib/types";
import { ChangeRiskBadge } from "@/components/ChangeRiskBadge";
import { ValueVisual } from "@/components/visual/ValueVisual";
import { changeTypeLabel, groupLabel, prettyTokenName } from "@/lib/ui/tokenValue";

interface ChangeCardProps {
  change: TokenChange;
}

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiffBlock({ change }: ChangeCardProps) {
  const { type, group, githubValue, figmaValue, affectedMode } = change;

  if (type === "added") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-ink-muted">Proposed</span>
        <ValueVisual value={figmaValue ?? null} group={group} />
      </div>
    );
  }

  if (type === "removed") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-ink-muted">Current</span>
        <div className="opacity-70 line-through decoration-ink-muted">
          <ValueVisual value={githubValue ?? null} group={group} />
        </div>
      </div>
    );
  }

  if (type === "rename-candidate") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono text-xs text-ink-muted line-through">
          {prettyTokenName(change.token)}
        </span>
        <Arrow />
        <span className="font-mono text-xs text-ink">{prettyTokenName(change.token)}</span>
      </div>
    );
  }

  if (type === "missing-mode") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="text-xs text-ink-soft">
          Figma is missing the <span className="font-medium text-ink">{affectedMode}</span>{" "}
          breakpoint value.
        </div>
      </div>
    );
  }

  if (type === "mode-change") {
    return (
      <div className="text-sm text-ink-soft">
        Mode-specific values were updated across breakpoints.
      </div>
    );
  }

  if (type === "description-change") {
    return (
      <div className="text-sm text-ink-soft">Description-only change. Visual output unchanged.</div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs uppercase tracking-wide text-ink-muted">Current</span>
        <ValueVisual value={githubValue ?? null} group={group} />
      </div>
      <Arrow />
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs uppercase tracking-wide text-ink-muted">Proposed</span>
        <ValueVisual value={figmaValue ?? null} group={group} />
      </div>
    </div>
  );
}

export function ChangeCard({ change }: ChangeCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="align-top border-t border-surface-muted first:border-t-0">
        <td className="px-4 py-3">
          <button
            onClick={() => setOpen(!open)}
            className="text-left group"
            aria-expanded={open}
            aria-label={`Toggle details for ${prettyTokenName(change.token)}`}
          >
            <div className="text-sm font-semibold text-ink group-hover:text-accent transition">
              {prettyTokenName(change.token)}
            </div>
            <div className="font-mono text-xs text-ink-muted mt-0.5">{change.token}</div>
          </button>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-ink-soft">
            {groupLabel(change.group)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs uppercase tracking-wide text-ink-muted">{changeTypeLabel(change.type)}</span>
        </td>
        <td className="px-4 py-3">
          <DiffBlock change={change} />
        </td>
        <td className="px-4 py-3">
          <ChangeRiskBadge risk={change.risk} />
        </td>
      </tr>
      {open && (
        <tr className="bg-surface-subtle/65 border-t border-surface-muted">
          <td colSpan={5} className="px-4 py-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">
                  Designer context
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">{change.designerExplanation}</p>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">
                  Developer context
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">{change.developerExplanation}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
