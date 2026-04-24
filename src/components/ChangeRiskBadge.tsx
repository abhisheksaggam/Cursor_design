import type { RiskLevel } from "@/lib/types";

const STYLES: Record<RiskLevel, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
  safe: {
    label: "Safe",
    dotClass: "bg-success",
    textClass: "text-success",
    bgClass: "bg-success-soft"
  },
  "review-needed": {
    label: "Needs review",
    dotClass: "bg-warning",
    textClass: "text-warning",
    bgClass: "bg-warning-soft"
  },
  breaking: {
    label: "Breaking",
    dotClass: "bg-danger",
    textClass: "text-danger",
    bgClass: "bg-danger-soft"
  }
};

export function ChangeRiskBadge({ risk, size = "sm" }: { risk: RiskLevel; size?: "sm" | "md" }) {
  const style = STYLES[risk];
  const padding = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.bgClass} ${style.textClass} ${padding}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dotClass}`} />
      {style.label}
    </span>
  );
}
