import type { TokenValue } from "@/lib/types";

interface TypeSpecimenProps {
  value: TokenValue;
  family?: string;
  weight?: string;
  label?: string;
}

export function TypeSpecimen({
  value,
  family = "var(--font-sans)",
  weight = "500",
  label
}: TypeSpecimenProps) {
  const size = typeof value === "number" ? value : 16;
  const displaySize = Math.min(56, Math.max(12, size));

  return (
    <div className="flex items-end gap-4">
      <span
        className="text-ink leading-none"
        style={{ fontSize: `${displaySize}px`, fontFamily: family, fontWeight: weight as number | string }}
      >
        Aa
      </span>
      <div className="flex flex-col">
        <span className="font-mono text-xs text-ink-soft">{size}px</span>
        {label && <span className="text-xs text-ink-muted">{label}</span>}
      </div>
    </div>
  );
}
