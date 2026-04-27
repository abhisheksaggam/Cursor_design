export type TokenGroup = "color" | "spacing" | "typography" | "radius" | "shadow";

export type TokenValue = string | number | Record<string, unknown> | null;

export interface NormalizedToken {
  group: TokenGroup;
  name: string;
  value: TokenValue;
  description?: string;
  owner?: string;
  deprecated?: boolean;
  replacement?: string | null;
  figmaVariableId?: string | null;
  modes?: Record<string, TokenValue>;
  aliasOf?: string | null;
  type?: string;
}

export interface NormalizedTokenDocument {
  generatedAt: string;
  sourceOfTruth: "github";
  externalInput: string;
  figmaSourceFile: string | null;
  tokens: Record<TokenGroup, Record<string, NormalizedToken>>;
  conflicts?: Array<{ token: string; kept: string | null; replaced: string | null }>;
}

export type ChangeType =
  | "added"
  | "removed"
  | "value-change"
  | "alias-change"
  | "mode-change"
  | "description-change"
  | "type-change"
  | "rename-candidate"
  | "missing-mode";

export type RiskLevel = "safe" | "review-needed" | "breaking";

export interface TokenChange {
  token: string;
  group: TokenGroup;
  type: ChangeType;
  risk: RiskLevel;
  affectedMode?: string | null;
  githubValue?: TokenValue;
  figmaValue?: TokenValue;
  note: string;
  designerExplanation: string;
  developerExplanation: string;
}

export interface ComparePreview {
  figmaSourceFile: string | null;
  totals: {
    total: number;
    safe: number;
    reviewNeeded: number;
    breaking: number;
  };
  changes: TokenChange[];
  proposedSource: NormalizedTokenDocument;
}

export interface HealthStatus {
  ok: boolean;
  figmaLive: boolean;
  githubLive: boolean;
  figmaSourceFile: string | null;
}

export interface BranchInfo {
  name: string;
  protected: boolean;
  sha: string;
}

export interface CreateTokenPrResult {
  prUrl: string;
  newBranch: string;
  commitSha?: string;
}
