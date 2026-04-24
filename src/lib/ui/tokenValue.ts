import type { TokenGroup, TokenValue } from "@/lib/types";

export type ValueKind = "color" | "size" | "text" | "unknown";

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function isRgba(value: unknown): value is RgbaColor {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.r === "number" &&
    typeof candidate.g === "number" &&
    typeof candidate.b === "number"
  );
}

export function valueKind(value: TokenValue, group?: TokenGroup): ValueKind {
  if (isRgba(value)) return "color";
  if (typeof value === "number") return "size";
  if (typeof value === "string") return "text";
  if (group === "color") return "color";
  if (group === "spacing" || group === "typography") return "size";
  return "unknown";
}

function channel(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}

export function rgbaToCss(value: RgbaColor): string {
  const alpha = value.a ?? 1;
  return `rgba(${channel(value.r)}, ${channel(value.g)}, ${channel(value.b)}, ${alpha})`;
}

export function rgbaToHex(value: RgbaColor): string {
  const parts = [channel(value.r), channel(value.g), channel(value.b)].map((c) =>
    c.toString(16).padStart(2, "0")
  );
  return `#${parts.join("").toUpperCase()}`;
}

export function formatValueLabel(value: TokenValue, group?: TokenGroup): string {
  if (value === null || value === undefined) return "-";
  if (isRgba(value)) return rgbaToHex(value);
  if (typeof value === "number") {
    if (group === "typography" || group === "spacing") return `${value}px`;
    return String(value);
  }
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

const CHANGE_LABELS: Record<string, string> = {
  added: "New",
  removed: "Removed",
  "value-change": "Updated",
  "alias-change": "Link changed",
  "mode-change": "Responsive values changed",
  "description-change": "Description updated",
  "type-change": "Type changed",
  "rename-candidate": "Renamed",
  "missing-mode": "Breakpoint missing"
};

export function changeTypeLabel(changeType: string): string {
  return CHANGE_LABELS[changeType] || changeType;
}

const GROUP_LABELS: Record<TokenGroup, string> = {
  color: "Color",
  spacing: "Spacing",
  typography: "Typography",
  radius: "Radius",
  shadow: "Shadow"
};

export function groupLabel(group: TokenGroup): string {
  return GROUP_LABELS[group] || group;
}

export function prettyTokenName(token: string): string {
  const parts = token.split(".");
  if (parts.length <= 1) return token;
  return parts.slice(1).join(" / ").replace(/-/g, " ");
}
