"use client";

import { useEffect, useState } from "react";

export interface BranchOption {
  name: string;
  protected: boolean;
}

interface BranchSelectorProps {
  value: string | null;
  onChange: (branch: string) => void;
}

export function BranchSelector({ value, onChange }: BranchSelectorProps) {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/github/branches");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load branches.");
        if (!cancelled) setBranches(data.branches || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-ink-muted mb-2">
        Target branch
      </label>
      {loading ? (
        <div className="text-sm text-ink-soft">Loading branches...</div>
      ) : error ? (
        <div className="text-sm text-danger">{error}</div>
      ) : branches.length === 0 ? (
        <div className="text-sm text-ink-soft">No branches available.</div>
      ) : (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-surface-muted rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="" disabled>
            Select a branch
          </option>
          {branches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name}
              {branch.protected ? " (protected)" : ""}
            </option>
          ))}
        </select>
      )}
      <p className="text-xs text-ink-muted mt-2">
        A new branch will be created from this target for the PR.
      </p>
    </div>
  );
}
