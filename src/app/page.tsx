import { TokenUpdateChecker } from "@/components/TokenUpdateChecker";
import { ALLOWED_FIGMA_SOURCE_FILE, loadEnvConfig } from "@/lib/config";

export default function Page() {
  const env = loadEnvConfig();

  return (
    <main className="space-y-10">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Token governance
        </div>
        <h1 className="text-3xl font-semibold text-ink tracking-tight">
          Design system consistency, reviewed before it ships.
        </h1>
        <p className="text-ink-soft max-w-2xl">
          Designers trigger a check from Figma. The system shows a review-ready preview of what
          changed, why it matters, and which items need owner approval. GitHub stays the source of
          truth; nothing is pushed without a human decision.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <InfoCard
          eyebrow="Upstream source"
          title="Approved Figma file"
          body="Only this file is accepted as a token source. Policy is enforced in code and CI."
          hint={ALLOWED_FIGMA_SOURCE_FILE}
          href={ALLOWED_FIGMA_SOURCE_FILE}
        />
        <InfoCard
          eyebrow="Source of truth"
          title="GitHub repository"
          body={`Canonical token file: ${env.githubTokenFilePath}`}
          hint={
            env.githubOwner && env.githubRepo
              ? `${env.githubOwner}/${env.githubRepo}`
              : "Repo not configured"
          }
        />
        <InfoCard
          eyebrow="Environment"
          title={env.demoMode ? "Demo mode" : "Live mode"}
          body={
            env.demoMode
              ? "Using seeded fixtures so designers can walk the full flow end-to-end."
              : "Real Figma and GitHub credentials are connected."
          }
          hint={env.demoMode ? `Missing env: ${env.missing.join(", ")}` : "All env vars set"}
        />
      </section>

      <TokenUpdateChecker />
    </main>
  );
}

function InfoCard({
  eyebrow,
  title,
  body,
  hint,
  href
}: {
  eyebrow: string;
  title: string;
  body: string;
  hint?: string;
  href?: string;
}) {
  return (
    <div className="bg-white border border-surface-muted rounded-2xl shadow-card p-5">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{eyebrow}</div>
      <div className="text-base font-semibold text-ink mt-1">{title}</div>
      <div className="text-sm text-ink-soft mt-1">{body}</div>
      {hint &&
        (href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent underline break-all mt-3 block"
          >
            {hint}
          </a>
        ) : (
          <div className="text-xs text-ink-muted break-all mt-3">{hint}</div>
        ))}
    </div>
  );
}
