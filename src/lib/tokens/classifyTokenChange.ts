import type { ChangeType, RiskLevel } from "@/lib/types";

export function classifyRisk(changeType: ChangeType): RiskLevel {
  switch (changeType) {
    case "added":
    case "description-change":
      return "safe";
    case "value-change":
    case "alias-change":
    case "mode-change":
      return "review-needed";
    case "removed":
    case "rename-candidate":
    case "type-change":
    case "missing-mode":
      return "breaking";
    default:
      return "review-needed";
  }
}

export function explanations(changeType: ChangeType, token: string): {
  designer: string;
  developer: string;
  note: string;
} {
  switch (changeType) {
    case "added":
      return {
        designer: `A new token "${token}" is available in Figma. Check if it belongs in the shared system.`,
        developer: `Token "${token}" is missing in GitHub. Safe to add if scope and naming are intentional.`,
        note: "New token proposed from Figma."
      };
    case "removed":
      return {
        designer: `Token "${token}" exists in GitHub but not in Figma. Confirm this was intentional.`,
        developer: `Token "${token}" would be removed from source. Breaking change if code references it.`,
        note: "Token missing in Figma (removal proposal)."
      };
    case "value-change":
      return {
        designer: `Token "${token}" value changed in Figma. Please verify the intended visual effect.`,
        developer: `Token "${token}" value differs between Figma and GitHub. Confirm no unintended visual regressions.`,
        note: "Token value differs between Figma and GitHub."
      };
    case "alias-change":
      return {
        designer: `Token "${token}" references a different design decision in Figma than in GitHub.`,
        developer: `Token "${token}" alias target changed. Can cascade into many components.`,
        note: "Token alias target changed."
      };
    case "mode-change":
      return {
        designer: `Responsive/mode values for "${token}" changed in Figma. Review breakpoint-specific visuals.`,
        developer: `Mode-specific values for "${token}" differ. Confirm breakpoints still meet design spec.`,
        note: "Mode-specific values changed."
      };
    case "description-change":
      return {
        designer: `Description of "${token}" was updated in Figma. Visual output is unchanged.`,
        developer: `Only metadata changed for "${token}". Safe to merge.`,
        note: "Description-only change."
      };
    case "type-change":
      return {
        designer: `Token "${token}" type changed in Figma. This is a structural change.`,
        developer: `Token "${token}" type changed. Likely breaks consuming code.`,
        note: "Token type changed."
      };
    case "rename-candidate":
      return {
        designer: `Token "${token}" appears to have been renamed in Figma. Confirm the new name and retire the old one.`,
        developer: `Token "${token}" was likely renamed. Requires coordinated refactor and deprecation plan.`,
        note: "Likely rename detected."
      };
    case "missing-mode":
      return {
        designer: `Token "${token}" is missing a responsive mode that exists in GitHub. Confirm this is intentional.`,
        developer: `Token "${token}" is missing modes present in GitHub. This can break responsive layouts.`,
        note: "Missing mode mapping."
      };
    default:
      return {
        designer: `Change detected on "${token}". Review for intent.`,
        developer: `Change detected on "${token}".`,
        note: "Change detected."
      };
  }
}
