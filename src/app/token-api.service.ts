import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, throwError, timeout } from "rxjs";
import type { BranchInfo, ComparePreview, CreateTokenPrResult, HealthStatus } from "../shared/types";

@Injectable({ providedIn: "root" })
export class TokenApiService {
  private readonly requestTimeoutMs = 15000;

  constructor(private readonly http: HttpClient) {}

  compareTokens() {
    return this.http
      .post<ComparePreview>(`/api/tokens/compare?refresh=${Date.now()}`, {})
      .pipe(
        timeout(this.requestTimeoutMs),
        catchError((error) => {
          if (error?.name === "TimeoutError") {
            return throwError(
              () =>
                new Error(
                  "Check updates timed out after 15s. Refresh the page and ensure only http://localhost:4200 is open."
                )
            );
          }
          return throwError(() => error);
        })
      );
  }

  fetchHealth() {
    return this.http.get<HealthStatus>("/api/health");
  }

  fetchBranches() {
    return this.http.get<{ branches: BranchInfo[] }>("/api/github/branches");
  }

  createPr(input: {
    baseBranch: string;
    preview: ComparePreview;
    updatedDocument: ComparePreview["proposedSource"];
    commitMessage: string;
  }) {
    return this.http.post<CreateTokenPrResult>("/api/github/create-pr", input);
  }
}
