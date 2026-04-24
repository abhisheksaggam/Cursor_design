import { isRgba, rgbaToCss, rgbaToHex } from "@/lib/ui/tokenValue";
import type { TokenValue } from "@/lib/types";

interface ColorSwatchProps {
  value: TokenValue;
  size?: "sm" | "md" | "lg";
  label?: boolean;
}

export function ColorSwatch({ value, size = "md", label = true }: ColorSwatchProps) {
  const dimension = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const hasColor = isRgba(value);
  const bg = hasColor ? rgbaToCss(value) : "transparent";
  const hex = hasColor ? rgbaToHex(value) : "-";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dimension} rounded-lg border border-black/5 shadow-inner`}
        style={{
          backgroundColor: bg,
          backgroundImage: hasColor
            ? undefined
            : "repeating-linear-gradient(45deg, #e5e7eb 0 6px, #f3f4f6 6px 12px)"
        }}
        aria-label={hex}
      />
      {label && (
        <div className="flex flex-col text-xs text-ink-soft">
          <span className="font-mono text-ink">{hex}</span>
          {hasColor && <span className="text-ink-muted">{rgbaToCss(value)}</span>}
        </div>
      )}
    </div>
  );
}
