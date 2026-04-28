import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { SelectModule } from "primeng/select";
import { TagModule } from "primeng/tag";
import { TokenApiService } from "./token-api.service";
import type {
  BranchInfo,
  ChangeType,
  ComparePreview,
  CreateTokenPrResult,
  HealthStatus,
  RiskLevel,
  TokenChange,
  TokenGroup,
  TokenValue
} from "../shared/types";

type FilterValue = "all" | RiskLevel;

interface Option<T extends string> {
  label: string;
  value: T;
}

@Component({
  selector: "app-root",
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    SelectModule,
    TagModule
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements OnInit {
  readonly riskOptions: Option<FilterValue>[] = [
    { label: "All", value: "all" },
    { label: "Breaking", value: "breaking" },
    { label: "Review", value: "review-needed" },
    { label: "Safe", value: "safe" }
  ];

  preview: ComparePreview | null = null;
  checkedAt: Date | null = null;
  loading = false;
  error: string | null = null;
  riskFilter: FilterValue = "all";
  selectedBranch: string | null = null;
  branches: BranchInfo[] = [];
  branchLoading = false;
  branchError: string | null = null;
  health: HealthStatus | null = null;
  healthError: string | null = null;
  submitting = false;
  prResult: CreateTokenPrResult | null = null;
  prError: string | null = null;
  expandedRows: Record<string, boolean> = {};
  acknowledgments = {
    designIntent: false,
    breakingReviewed: true,
    policyConfirmed: true
  };

  constructor(
    private readonly api: TokenApiService,
    private readonly zone: NgZone,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadHealth();
    this.loadBranches();
  }

  get branchOptions(): Option<string>[] {
    return this.branches.map((branch) => ({
      label: `${branch.name}${branch.protected ? " (protected)" : ""}`,
      value: branch.name
    }));
  }

  get filteredChanges(): TokenChange[] {
    return (this.preview?.changes || []).filter((change) => {
      return this.riskFilter === "all" || change.risk === this.riskFilter;
    });
  }

  get totals() {
    return (
      this.preview?.totals || {
        total: 0,
        safe: 0,
        reviewNeeded: 0,
        breaking: 0
      }
    );
  }

  get overallRisk(): string {
    if (this.totals.breaking > 0) return "breaking";
    if (this.totals.reviewNeeded > 0) return "review";
    return "safe";
  }

  get designerImpact(): string {
    if (!this.preview || this.totals.total === 0) return "No visible design changes were found.";
    if (this.totals.breaking > 0) return "Breaking token changes need design-system owner review.";
    if (this.totals.reviewNeeded > 0) return "Some visual values changed and need design intent confirmation.";
    return "Only safe additive or metadata token changes were found.";
  }

  get developerImpact(): string {
    if (!this.preview || this.totals.total === 0) return "No token file changes are required.";
    if (this.totals.breaking > 0) return "Token updates may affect consuming code and should be reviewed before merge.";
    if (this.totals.reviewNeeded > 0) return "Token source can be updated after engineering review.";
    return "Proposed token file changes are low risk.";
  }

  get allAcked(): boolean {
    return Object.values(this.acknowledgments).every(Boolean);
  }

  get figmaLive(): boolean {
    return this.health?.figmaLive ?? true;
  }

  get githubLive(): boolean {
    return this.health?.githubLive ?? true;
  }

  private toErrorMessage(error: unknown, fallback: string): string {
    const candidate = error as
      | { error?: unknown; message?: string }
      | { error?: { error?: unknown; message?: string }; message?: string }
      | null
      | undefined;
    const nested = candidate && typeof candidate === "object" ? candidate.error : undefined;
    const direct =
      typeof candidate?.message === "string"
        ? candidate.message
        : typeof candidate?.error === "string"
          ? candidate.error
          : undefined;
    if (direct) return direct;
    if (nested && typeof nested === "object") {
      const nestedObj = nested as { error?: unknown; message?: string };
      if (typeof nestedObj.error === "string") return nestedObj.error;
      if (typeof nestedObj.message === "string") return nestedObj.message;
      try {
        return JSON.stringify(nestedObj);
      } catch {
        return fallback;
      }
    }
    if (nested && typeof nested === "string") return nested;
    try {
      return JSON.stringify(error) || fallback;
    } catch {
      return fallback;
    }
  }

  loadHealth() {
    this.healthError = null;
    this.api.fetchHealth().subscribe({
      next: (status) => {
        this.health = status;
      },
      error: (error) => {
        this.healthError = this.toErrorMessage(error, "Failed to load live status.");
      }
    });
  }

  runCheck() {
    this.loading = true;
    this.error = null;
    this.prResult = null;
    this.api.compareTokens().subscribe({
      next: (preview) => {
        setTimeout(() => {
          this.zone.run(() => {
            this.preview = preview;
            this.checkedAt = new Date();
            this.acknowledgments = {
              designIntent: false,
              breakingReviewed: preview.totals.breaking === 0,
              policyConfirmed: true
            };
            this.loadHealth();
            this.loading = false;
            this.changeDetector.detectChanges();
          });
        }, 250);
      },
      error: (error) => {
        setTimeout(() => {
          this.zone.run(() => {
            this.error = this.toErrorMessage(error, "Failed to compare tokens.");
            this.loading = false;
            this.changeDetector.detectChanges();
          });
        }, 250);
      }
    });
  }

  loadBranches() {
    this.branchLoading = true;
    this.branchError = null;
    this.api.fetchBranches().subscribe({
      next: (result) => {
        setTimeout(() => {
          this.zone.run(() => {
            this.branches = result.branches || [];
            this.branchLoading = false;
          });
        }, 0);
      },
      error: (error) => {
        setTimeout(() => {
          this.zone.run(() => {
            this.branchError = this.toErrorMessage(error, "Failed to load branches.");
            this.branchLoading = false;
          });
        }, 0);
      }
    });
  }

  createPr() {
    if (!this.preview || !this.selectedBranch) return;
    this.submitting = true;
    this.prError = null;
    this.api
      .createPr({
        baseBranch: this.selectedBranch,
        preview: this.preview,
        updatedDocument: this.preview.proposedSource,
        prTitle: "chore(tokens): sync tokens from Figma"
      })
      .subscribe({
        next: (result) => {
          this.prResult = result;
          this.submitting = false;
        },
        error: (error) => {
          this.prError = this.toErrorMessage(error, "Failed to create PR.");
          this.submitting = false;
        }
      });
  }

  changeKey(change: TokenChange): string {
    return `${change.token}-${change.type}-${change.affectedMode || ""}`;
  }

  toggleDetails(change: TokenChange) {
    const key = this.changeKey(change);
    this.expandedRows[key] = !this.expandedRows[key];
  }

  isExpanded(change: TokenChange): boolean {
    return !!this.expandedRows[this.changeKey(change)];
  }

  groupLabel(group: TokenGroup): string {
    return {
      color: "Color",
      spacing: "Spacing",
      typography: "Typography",
      radius: "Radius",
      shadow: "Shadow"
    }[group];
  }

  riskSeverity(risk: RiskLevel): "success" | "warn" | "danger" {
    if (risk === "breaking") return "danger";
    if (risk === "review-needed") return "warn";
    return "success";
  }

  riskLabel(risk: RiskLevel): string {
    return risk === "review-needed" ? "Review" : risk === "breaking" ? "Breaking" : "Safe";
  }

  changeTypeLabel(changeType: ChangeType): string {
    const labels: Record<ChangeType, string> = {
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
    return labels[changeType];
  }

  prettyTokenName(token: string): string {
    const parts = token.split(".");
    return parts.length <= 1 ? token : parts.slice(1).join(" / ").replace(/-/g, " ");
  }

  formatValue(value: TokenValue, group?: TokenGroup): string {
    if (value === null || value === undefined) return "-";
    if (this.isRgba(value)) return this.rgbaToHex(value);
    if (typeof value === "number") return group === "spacing" || group === "typography" ? `${value}px` : `${value}`;
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  valueStyle(value: TokenValue): Record<string, string> {
    return this.isRgba(value) ? { backgroundColor: this.rgbaToCss(value) } : {};
  }

  isRgba(value: unknown): value is { r: number; g: number; b: number; a?: number } {
    const candidate = value as Record<string, unknown> | null;
    return !!candidate && typeof candidate.r === "number" && typeof candidate.g === "number" && typeof candidate.b === "number";
  }

  private rgbaToHex(value: { r: number; g: number; b: number }): string {
    const channel = (number: number) =>
      Math.round(Math.max(0, Math.min(1, number)) * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${channel(value.r)}${channel(value.g)}${channel(value.b)}`.toUpperCase();
  }

  private rgbaToCss(value: { r: number; g: number; b: number; a?: number }): string {
    const channel = (number: number) => Math.round(Math.max(0, Math.min(1, number)) * 255);
    return `rgba(${channel(value.r)}, ${channel(value.g)}, ${channel(value.b)}, ${value.a ?? 1})`;
  }
}
