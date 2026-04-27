"use client";

import { useState } from "react";
import { BranchSelector } from "@/components/BranchSelector";
import type { ComparePreview } from "@/lib/types";

interface ApprovalPanelProps {
  preview: ComparePreview;
  demoMode: boolean;
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ApprovalPanel({ preview, demoMode }: ApprovalPanelProps) {
  const [branch, setBranch] = useState<string | null>(null);
  const [acknowledgments, setAcknowledgments] = useState({
    designIntent: false,
    breakingReviewed: preview.totals.breaking === 0,
    policyConfirmed: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ prUrl: string; newBranch: string; demoMode: boolean } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const allAcked = Object.values(acknowledgments).every(Boolean);
  const readyToSubmit = !!branch && allAcked && !submitting;

  async function handleCreatePr() {
    if (!branch) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseBranch: branch,
          preview,
          updatedDocument: preview.proposedSource,
          prTitle: "chore(tokens): sync tokens from Figma"
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create PR.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white border border-surface-muted rounded-2xl shadow-card">
      <header className="px-6 py-5 border-b border-surface-muted flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-ink-muted">Governance checkpoint</div>
          <h2 className="text-lg font-semibold text-ink mt-1">Approve and open PR</h2>
          <p className="text-sm text-ink-soft mt-1 max-w-2xl">
            Nothing ships to code yet. On approval, a new branch is created from your selected
            base and a PR is opened for review.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-soft bg-surface-subtle rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Figma source policy verified
        </div>
      </header>

      <div className="px-6 py-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
              Impact summary
            </label>
            <dl className="grid grid-cols-3 gap-2">
              <ImpactStat label="Breaking" value={preview.totals.breaking} tone="danger" />
              <ImpactStat label="Review" value={preview.totals.reviewNeeded} tone="warning" />
              <ImpactStat label="Safe" value={preview.totals.safe} tone="success" />
            </dl>
          </div>

          <BranchSelector value={branch} onChange={setBranch} />
        </div>

        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-wide text-ink-muted">
            Pre-merge acknowledgments
          </label>

          <Ack
            checked={acknowledgments.designIntent}
            onChange={(v) => setAcknowledgments({ ...acknowledgments, designIntent: v })}
            title="Design intent confirmed"
            body="Designer reviewed the preview and confirms the proposed values match the intended decision."
          />

          <Ack
            checked={acknowledgments.breakingReviewed}
            disabled={preview.totals.breaking === 0}
            onChange={(v) => setAcknowledgments({ ...acknowledgments, breakingReviewed: v })}
            title={
              preview.totals.breaking === 0
                ? "No breaking changes"
                : `Breaking changes reviewed (${preview.totals.breaking})`
            }
            body={
              preview.totals.breaking === 0
                ? "This release has no breaking drift."
                : "Design-system owner has validated names, deprecations, and rename plans."
            }
          />

          <Ack
            checked={acknowledgments.policyConfirmed}
            onChange={(v) => setAcknowledgments({ ...acknowledgments, policyConfirmed: v })}
            title="Figma source is the approved file"
            body="This workspace only accepts tokens from the single approved Figma file."
          />
        </div>
      </div>

      <footer className="px-6 py-5 border-t border-surface-muted flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-ink-muted">
          {demoMode
            ? "Demo mode - PR creation is disabled until environment variables are set."
            : "You can still edit the PR body in GitHub after creation."}
        </div>
        <button
          onClick={handleCreatePr}
          disabled={!readyToSubmit || demoMode}
          className="inline-flex items-center gap-2 bg-variable-purple text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-variable-purple-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Opening PR..." : demoMode ? "PR disabled in demo mode" : "Approve and open PR"}
        </button>
      </footer>

      {error && <div className="px-6 pb-5 text-sm text-danger">{error}</div>}

      {result && (
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-success-soft bg-success-soft/70 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-success font-medium">
              <CheckIcon />
              PR prepared
            </div>
            <div className="text-ink-soft mt-1">Branch: {result.newBranch}</div>
            {result.demoMode ? (
              <div className="text-ink-soft mt-1">
                Demo mode - no real PR was opened.
              </div>
            ) : (
              <a
                className="text-accent underline mt-1 inline-block"
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open PR
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ImpactStat({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "success";
}) {
  const bg =
    tone === "danger" ? "bg-danger-soft" : tone === "warning" ? "bg-warning-soft" : "bg-success-soft";
  const text =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-success";
  return (
    <div className={`rounded-lg ${bg} px-3 py-2`}>
      <div className={`text-lg font-semibold ${text}`}>{value}</div>
      <div className="text-[11px] text-ink-soft mt-0.5">{label}</div>
    </div>
  );
}

function Ack({
  checked,
  onChange,
  title,
  body,
  disabled
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition cursor-pointer ${
        checked ? "border-accent/50 bg-accent/5" : "border-surface-muted bg-white"
      } ${disabled ? "opacity-70" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-surface-muted text-accent focus:ring-accent"
      />
      <div>
        <div className="text-sm font-medium text-ink">{title}</div>
        <div className="text-xs text-ink-soft mt-0.5">{body}</div>
      </div>
    </label>
  );
}
