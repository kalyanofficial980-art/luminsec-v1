import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import { PrintReportButton } from "@/components/reports/print-report-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function normalizeRisk(value: unknown) {
  const risk = String(value ?? "unknown").toLowerCase();

  if (risk.includes("critical")) return "critical";
  if (risk.includes("high")) return "high";
  if (risk.includes("medium") || risk.includes("moderate")) return "medium";
  if (risk.includes("low")) return "low";

  return "review";
}

function riskLabel(value: unknown) {
  const risk = normalizeRisk(value);

  if (risk === "critical") return "Critical";
  if (risk === "high") return "High";
  if (risk === "medium") return "Medium";
  if (risk === "low") return "Low";

  return "Review";
}

function scoreTone(score: number) {
  if (score >= 85) return "excellent";
  if (score >= 65) return "needs-review";
  if (score >= 40) return "weak";
  return "critical";
}

function safeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(body: unknown, label: string) {
  const text = normalizeText(body);
  const pattern = new RegExp(
    `${escapeRegExp(label)}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][A-Za-z\\s]+:|$)`,
    "i"
  );
  const match = text.match(pattern);

  return normalizeText(match?.[1]);
}

function evidenceLines(value: unknown) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className={`score-box ${scoreTone(value)}`}>
      <p className="score-label">{label}</p>
      <p className="score-value">{value}</p>
      <p className="score-outof">out of 100</p>
    </div>
  );
}

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="report-card avoid-break">
      <h2>{title}</h2>

      {items.length > 0 ? (
        <ol className="number-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <p className="muted">No specific items available for this section.</p>
      )}
    </section>
  );
}

export default async function PrintReportPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select(
      "id, user_id, website_id, url, domain, status, overall_score, score, security_score, privacy_score, trust_score, risk_level, summary, raw_result, raw, created_at"
    )
    .eq("id", id);

  if (profile.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    notFound();
  }

  let findingsQuery = supabase
    .from("scan_findings")
    .select("id, category, severity, title, description, recommendation, evidence, created_at")
    .eq("scan_result_id", scan.id)
    .order("created_at", { ascending: true });

  if (profile.role !== "admin") {
    findingsQuery = findingsQuery.eq("user_id", user.id);
  }

  const { data: findings } = await findingsQuery;

  let websiteName = scan.domain || "Website";

  if (scan.website_id) {
    let websiteQuery = supabase
      .from("websites")
      .select("name, url, domain")
      .eq("id", scan.website_id);

    if (profile.role !== "admin") {
      websiteQuery = websiteQuery.eq("user_id", user.id);
    }

    const { data: website } = await websiteQuery.maybeSingle();

    websiteName = website?.name || website?.domain || scan.domain || "Website";
  }

  const rawResult = (scan.raw_result || scan.raw || {}) as {
    professional?: {
      summary?: {
        score?: {
          overall?: number;
          security?: number;
          privacy?: number;
          trust?: number;
          exposure?: number;
          technicalHygiene?: number;
        };
        topRisks?: string[];
        fastestFixes?: string[];
        ownerActions?: string[];
        developerActions?: string[];
      };
    };
  };

  const professionalSummary = rawResult.professional?.summary;

  const overallScore = clampScore(
    professionalSummary?.score?.overall ?? scan.overall_score ?? scan.score
  );
  const securityScore = clampScore(
    professionalSummary?.score?.security ?? scan.security_score
  );
  const privacyScore = clampScore(
    professionalSummary?.score?.privacy ?? scan.privacy_score
  );
  const trustScore = clampScore(
    professionalSummary?.score?.trust ?? scan.trust_score
  );
  const exposureScore = clampScore(professionalSummary?.score?.exposure ?? 0);
  const hygieneScore = clampScore(professionalSummary?.score?.technicalHygiene ?? 0);

  const topRisks = safeArray(professionalSummary?.topRisks);
  const fastestFixes = safeArray(professionalSummary?.fastestFixes);
  const ownerActions = safeArray(professionalSummary?.ownerActions);
  const developerActions = safeArray(professionalSummary?.developerActions);

  const reportUrl = scan.url || `https://${scan.domain}`;

  return (
    <main className="print-page">
      <style>{`
        :root {
          color-scheme: light;
        }

        body {
          background: #f8fafc;
        }

        .print-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: Arial, Helvetica, sans-serif;
          padding: 32px;
        }

        .screen-toolbar {
          max-width: 1100px;
          margin: 0 auto 20px auto;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .screen-link,
        .print-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 14px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          padding: 11px 14px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .print-button {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
          cursor: pointer;
        }

        .report-sheet {
          max-width: 1100px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
        }

        .hero {
          padding: 42px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #0f172a, #164e63);
          color: #ffffff;
        }

        .brand-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 900;
        }

        .brand-icon {
          display: inline-flex;
          height: 44px;
          width: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(34, 211, 238, 0.15);
          border: 1px solid rgba(103, 232, 249, 0.35);
        }

        .report-type {
          margin-top: 32px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #67e8f9;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          margin: 12px 0 0 0;
          font-size: 44px;
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .url {
          margin-top: 14px;
          color: #dbeafe;
          word-break: break-all;
          font-size: 14px;
        }

        .summary {
          margin-top: 24px;
          max-width: 800px;
          color: #e2e8f0;
          font-size: 17px;
          line-height: 1.7;
        }

        .hero-score {
          min-width: 180px;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(15,23,42,0.35);
          padding: 22px;
          text-align: center;
        }

        .hero-score-label {
          color: #cbd5e1;
          font-weight: 800;
          font-size: 13px;
        }

        .hero-score-value {
          margin-top: 8px;
          font-size: 64px;
          line-height: 1;
          font-weight: 900;
        }

        .risk-pill {
          margin-top: 14px;
          display: inline-flex;
          border-radius: 999px;
          background: #ffffff;
          color: #0f172a;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .content {
          padding: 34px 42px 42px 42px;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 26px;
        }

        .meta-card {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 16px;
        }

        .meta-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .meta-value {
          margin-top: 6px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 900;
          word-break: break-word;
        }

        .score-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin: 26px 0;
        }

        .score-box {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          background: #f8fafc;
        }

        .score-box.excellent {
          border-color: #bbf7d0;
          background: #f0fdf4;
        }

        .score-box.needs-review {
          border-color: #fde68a;
          background: #fffbeb;
        }

        .score-box.weak {
          border-color: #fed7aa;
          background: #fff7ed;
        }

        .score-box.critical {
          border-color: #fecaca;
          background: #fef2f2;
        }

        .score-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .score-value {
          margin: 8px 0 0 0;
          color: #0f172a;
          font-size: 32px;
          font-weight: 900;
        }

        .score-outof {
          margin: 2px 0 0 0;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 800;
        }

        .two-col {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .report-card {
          border-radius: 22px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 22px;
        }

        .report-card h2 {
          margin: 0 0 14px 0;
          font-size: 20px;
          letter-spacing: -0.02em;
        }

        .number-list {
          margin: 0;
          padding-left: 22px;
        }

        .number-list li {
          margin: 10px 0;
          color: #334155;
          line-height: 1.65;
        }

        .muted {
          color: #64748b;
          line-height: 1.7;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 34px 0 16px 0;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .finding {
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          margin-top: 18px;
          overflow: hidden;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .finding-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .finding-number {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .finding-title {
          margin: 6px 0 0 0;
          font-size: 21px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .badge {
          display: inline-flex;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 5px 10px;
          color: #334155;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .finding-body {
          padding: 20px;
        }

        .finding-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .mini-card {
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 16px;
        }

        .mini-card h4 {
          margin: 0;
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
        }

        .mini-card p {
          margin: 8px 0 0 0;
          color: #334155;
          line-height: 1.65;
          font-size: 13px;
        }

        .fix-box {
          margin-top: 12px;
          border-radius: 16px;
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          padding: 16px;
        }

        .fix-box h4 {
          margin: 0;
          color: #14532d;
          font-size: 14px;
          font-weight: 900;
        }

        .fix-box p {
          margin: 7px 0;
          color: #166534;
          font-size: 13px;
          line-height: 1.6;
        }

        .evidence-box {
          margin-top: 12px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 16px;
        }

        .evidence-box h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 900;
        }

        .evidence-line {
          margin-top: 8px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          color: #334155;
          font-family: Consolas, Monaco, monospace;
          font-size: 11px;
          line-height: 1.5;
          word-break: break-word;
        }

        .scope-note {
          margin-top: 34px;
          border-radius: 20px;
          border: 1px solid #fde68a;
          background: #fffbeb;
          padding: 20px;
          color: #78350f;
          line-height: 1.7;
        }

        .footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: #ffffff;
          }

          .print-page {
            padding: 0;
            background: #ffffff;
          }

          .screen-toolbar {
            display: none;
          }

          .report-sheet {
            max-width: none;
            border: 0;
            box-shadow: none;
          }

          .hero {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .content {
            padding: 26px 0 0 0;
          }

          .score-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .two-col {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .finding-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .print-page {
            padding: 16px;
          }

          .brand-row,
          .screen-toolbar,
          .footer {
            flex-direction: column;
          }

          .meta-grid,
          .score-grid,
          .two-col,
          .finding-grid {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 34px;
          }
        }
      `}</style>

      <div className="screen-toolbar">
        <Link href={`/dashboard/scans/${scan.id}`} className="screen-link">
          <ArrowLeft size={16} />
          Back to report
        </Link>
        <PrintReportButton />
      </div>

      <article className="report-sheet">
        <header className="hero">
          <div className="brand-row">
            <div>
              <div className="brand">
                <span className="brand-icon">
                  <ShieldCheck size={24} />
                </span>
                VeyraSec
              </div>

              <p className="report-type">Website security posture report</p>

              <h1>{websiteName}</h1>

              <a href={reportUrl} target="_blank" rel="noreferrer" className="url">
                {reportUrl} <ExternalLink size={13} />
              </a>

              <p className="summary">
                {normalizeText(
                  scan.summary,
                  "VeyraSec reviewed visible website security posture signals and generated a fix-first report."
                )}
              </p>
            </div>

            <div className="hero-score">
              <p className="hero-score-label">Overall score</p>
              <p className="hero-score-value">{overallScore}</p>
              <p className="hero-score-label">out of 100</p>
              <span className="risk-pill">{riskLabel(scan.risk_level)} risk</span>
            </div>
          </div>
        </header>

        <div className="content">
          <section className="meta-grid avoid-break">
            <div className="meta-card">
              <p className="meta-label">Report type</p>
              <p className="meta-value">Passive security posture</p>
            </div>
            <div className="meta-card">
              <p className="meta-label">Scan date</p>
              <p className="meta-value">
                {scan.created_at ? new Date(scan.created_at).toLocaleString("en-IN") : "Not available"}
              </p>
            </div>
            <div className="meta-card">
              <p className="meta-label">Scope</p>
              <p className="meta-value">Visible public signals only</p>
            </div>
          </section>

          <section className="score-grid avoid-break">
            <ScoreBox label="Security" value={securityScore} />
            <ScoreBox label="Privacy" value={privacyScore} />
            <ScoreBox label="Trust" value={trustScore} />
            <ScoreBox label="Exposure" value={exposureScore} />
            <ScoreBox label="Hygiene" value={hygieneScore} />
            <ScoreBox label="Overall" value={overallScore} />
          </section>

          <section className="two-col">
            <ListBlock title="Top risks" items={topRisks} />
            <ListBlock title="Fastest fixes" items={fastestFixes} />
          </section>

          <section className="two-col">
            <ListBlock title="Business owner actions" items={ownerActions} />
            <ListBlock title="Developer actions" items={developerActions} />
          </section>

          <h2 className="section-title">
            <FileText size={28} />
            Professional findings
          </h2>

          {(findings ?? []).length > 0 ? (
            (findings ?? []).map((finding, index) => {
              const whatWeFound =
                extractSection(finding.description, "What we found") ||
                normalizeText(finding.description, "This item should be reviewed.");

              const whyItMatters = extractSection(finding.description, "Why it matters");
              const businessImpact = extractSection(finding.description, "Business impact");
              const technicalImpact = extractSection(finding.description, "Technical impact");
              const confidence = extractSection(finding.description, "Confidence");

              const priority = extractSection(finding.recommendation, "Priority");
              const effort = extractSection(finding.recommendation, "Estimated effort");
              const fixSummary = extractSection(finding.recommendation, "Fix summary");
              const developerFix = extractSection(finding.recommendation, "Developer fix");
              const retest = extractSection(finding.recommendation, "Retest");

              const evidence = evidenceLines(finding.evidence);

              return (
                <section key={finding.id} className="finding">
                  <div className="finding-header">
                    <div>
                      <p className="finding-number">Finding #{index + 1}</p>
                      <h3 className="finding-title">
                        {normalizeText(finding.title, "Finding")}
                      </h3>

                      <div className="badge-row">
                        <span className="badge">{riskLabel(finding.severity)}</span>
                        <span className="badge">
                          {normalizeText(finding.category, "general").replaceAll("_", " ")}
                        </span>
                        {confidence ? <span className="badge">Confidence: {confidence}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="finding-body">
                    <div className="finding-grid">
                      <div className="mini-card">
                        <h4>What we found</h4>
                        <p>{whatWeFound}</p>
                      </div>

                      <div className="mini-card">
                        <h4>Why it matters</h4>
                        <p>
                          {whyItMatters ||
                            "This item can affect website security posture, trust, or technical hygiene."}
                        </p>
                      </div>

                      <div className="mini-card">
                        <h4>Business impact</h4>
                        <p>
                          {businessImpact ||
                            "This may reduce customer confidence or make the website look less security-ready."}
                        </p>
                      </div>

                      <div className="mini-card">
                        <h4>Technical impact</h4>
                        <p>
                          {technicalImpact ||
                            "Ask your developer to review this item in the website configuration."}
                        </p>
                      </div>
                    </div>

                    <div className="fix-box">
                      <h4>Fix-first guidance</h4>
                      {priority ? <p><strong>Priority:</strong> {priority}</p> : null}
                      {effort ? <p><strong>Estimated effort:</strong> {effort}</p> : null}
                      <p>
                        <strong>Fix summary:</strong>{" "}
                        {fixSummary || normalizeText(finding.recommendation, "Review and fix this issue.")}
                      </p>
                      {developerFix ? <p><strong>Developer fix:</strong> {developerFix}</p> : null}
                      {retest ? <p><strong>Retest:</strong> {retest}</p> : null}
                    </div>

                    <div className="evidence-box">
                      <h4>Evidence</h4>

                      {evidence.length > 0 ? (
                        evidence.map((line) => (
                          <div key={line} className="evidence-line">
                            {line}
                          </div>
                        ))
                      ) : (
                        <p className="muted">Evidence was not stored for this item.</p>
                      )}
                    </div>
                  </div>
                </section>
              );
            })
          ) : (
            <section className="report-card avoid-break">
              <CheckCircle2 size={26} />
              <h2>No visible findings saved</h2>
              <p className="muted">
                This scan did not store visible security posture findings.
              </p>
            </section>
          )}

          <section className="scope-note avoid-break">
            <strong>Important scope note:</strong> This is a passive website security posture report based on visible public signals.
            It is not legal advice, compliance certification, exploit testing, vulnerability exploitation,
            login testing, brute force testing, or a penetration test.
          </section>

          <footer className="footer">
            <span>Generated by VeyraSec</span>
            <span>Report ID: {scan.id}</span>
          </footer>
        </div>
      </article>
    </main>
  );
}