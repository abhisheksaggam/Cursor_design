"use client";

import { useState } from "react";
import type { ComparePreview } from "@/lib/types";
import { ChangeSummary } from "@/components/ChangeSummary";
import { TokenDiffPreview } from "@/components/TokenDiffPreview";
import { ApprovalPanel } from "@/components/ApprovalPanel";

export function TokenUpdateChecker() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ComparePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tokens/compare", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to compare tokens.");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="bg-white border border-surface-muted rounded-2xl shadow-card">
        <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-ink">Run consistency check</h2>
            <p className="text-sm text-ink-soft mt-1">
              Pulls Figma variables, compares against the GitHub token source, and surfaces
              drift as a review-ready design handoff.
            </p>
          </div>
          <button
            onClick={handleCheck}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-variable-blue text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-variable-blue-hover disabled:opacity-40"
          >
            {loading ? "Checking..." : preview ? "Re-run check" : "Check updates"}
          </button>
        </div>

        {preview?.demoMode && (
          <div className="mx-6 mb-5 rounded-lg border border-warning-soft bg-warning-soft/60 text-warning px-4 py-3 text-sm">
            <span className="font-medium">Demo mode</span> - using seeded fixture data because
            required environment variables are missing. PR creation is disabled.
          </div>
        )}

        {error && (
          <div className="mx-6 mb-5 rounded-lg bg-danger-soft text-danger px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!preview && !loading && !error && (
          <div className="mx-6 mb-6 rounded-xl border border-dashed border-surface-muted px-6 py-12 text-center text-ink-soft">
            Start with <span className="font-medium text-ink">Check updates</span> to fetch Figma
            variables and see what has drifted.
          </div>
        )}

        {loading && (
          <div className="mx-6 mb-6 rounded-xl border border-surface-muted px-6 py-12 text-center text-ink-soft">
            Reading Figma variables and comparing tokens...
          </div>
        )}
      </section>

      {preview && <ChangeSummary preview={preview} />}
      {preview && <TokenDiffPreview preview={preview} />}
      {preview && <ApprovalPanel preview={preview} demoMode={preview.demoMode} />}
    </div>
  );
}
