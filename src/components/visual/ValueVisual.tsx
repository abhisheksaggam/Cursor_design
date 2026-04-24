import type { TokenGroup, TokenValue } from "@/lib/types";
import { valueKind } from "@/lib/ui/tokenValue";
import { ColorSwatch } from "./ColorSwatch";
import { SpacingBar } from "./SpacingBar";
import { TypeSpecimen } from "./TypeSpecimen";

interface ValueVisualProps {
  value: TokenValue;
  group: TokenGroup;
  compact?: boolean;
}

export function ValueVisual({ value, group, compact }: ValueVisualProps) {
  const kind = valueKind(value, group);

  if (kind === "color") {
    return <ColorSwatch value={value} size={compact ? "sm" : "md"} />;
  }
  if (kind === "size" && group === "typography") {
    return <TypeSpecimen value={value} />;
  }
  if (kind === "size" && group === "spacing") {
    return <SpacingBar value={value} tone="neutral" />;
  }
  if (kind === "text") {
    return (
      <div className="font-mono text-xs bg-surface-subtle rounded px-2 py-1 inline-block text-ink-soft">
        {String(value)}
      </div>
    );
  }
  return <div className="text-xs text-ink-muted">No preview</div>;
}
