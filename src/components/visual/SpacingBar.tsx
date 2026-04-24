import type { TokenValue } from "@/lib/types";

interface SpacingBarProps {
  value: TokenValue;
  tone?: "neutral" | "current" | "proposed";
  max?: number;
}

export function SpacingBar({ value, tone = "neutral", max = 64 }: SpacingBarProps) {
  const px = typeof value === "number" ? value : 0;
  const width = Math.min(100, Math.max(2, (px / max) * 100));
  const toneClass =
    tone === "current"
      ? "bg-ink/60"
      : tone === "proposed"
        ? "bg-accent"
        : "bg-ink-muted";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-6 rounded bg-surface-muted/60 overflow-hidden">
        <div className={`h-full ${toneClass}`} style={{ width: `${width}%` }} />
      </div>
      <span className="font-mono text-xs text-ink-soft w-10 text-right">{px}px</span>
    </div>
  );
}
